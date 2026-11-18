const express = require("express");
const crypto = require("crypto");
const config = require("../lib/config");
const { wrap, fail, toId } = require("../lib/http");
const { parseFields, toDate, str } = require("../lib/validate");
const { authOptional, requireAuth, requireRole } = require("../lib/auth");
const { audit } = require("../lib/audit");
const { sendMail } = require("../lib/mailer");
const { promoteWaitlist } = require("../lib/rsvp");
const { toCsv, sendCsv } = require("../lib/csv");
const { eventToIcs } = require("../lib/ics");

const router = express.Router();
router.use(authOptional);

const HOUR = 3600 * 1000;
const CATEGORIES = ["Workshop", "Hackathon", "Talk", "Social", "Bootcamp", "Other"];
const SCHEMA = {
  title: { t: "str", max: 120, req: true, label: "Title" },
  description: { t: "str", max: 4000 },
  location: { t: "str", max: 200 },
  category: { t: "enum", values: CATEGORIES, def: "Other" },
  coverEmoji: { t: "str", max: 8 },
  slidesUrl: { t: "url" },
  recordingUrl: { t: "url" },
  capacity: { t: "int", min: 0, max: 5000, def: 0 }, // 0 = unlimited
  published: { t: "bool", def: true }
};

const endOf = (e) => (e.endDate ? new Date(e.endDate) : new Date(new Date(e.date).getTime() + 2 * HOUR));

function parseEvent(body) {
  const { data, error } = parseFields(SCHEMA, body);
  if (error) return { error };
  const date = toDate(body && body.date);
  if (!date) return { error: "A valid start date and time is required" };
  const endDate = toDate(body.endDate);
  if (body.endDate && !endDate) return { error: "The end time is not a valid date" };
  if (endDate && endDate <= date) return { error: "The end time must be after the start time" };
  return { data: { ...data, date, endDate: endDate || null } };
}

function view(e, t, mine) {
  return {
    id: String(e._id),
    title: e.title,
    description: e.description || "",
    date: e.date,
    endDate: e.endDate || null,
    location: e.location || "",
    category: e.category || "Other",
    coverEmoji: e.coverEmoji || "",
    capacity: e.capacity || 0,
    published: e.published !== false,
    slidesUrl: e.slidesUrl || "",
    recordingUrl: e.recordingUrl || "",
    going: (t && t.going) || 0,
    waitlist: (t && t.waitlist) || 0,
    myStatus: mine && mine.status !== "cancelled" ? mine.status : null,
    myAttended: !!(mine && mine.attended)
  };
}

async function tally(db, ids) {
  const map = new Map();
  if (!ids.length) return map;
  const rows = await db
    .collection("rsvps")
    .find({ eventId: { $in: ids }, status: { $in: ["going", "waitlist"] } })
    .toArray();
  for (const r of rows) {
    const key = String(r.eventId);
    const t = map.get(key) || { going: 0, waitlist: 0 };
    t[r.status] += 1;
    map.set(key, t);
  }
  return map;
}

async function loadEvent(req, res, { includeDraft = false } = {}) {
  const id = toId(req.params.id);
  const event = id ? await req.app.locals.db.collection("events").findOne({ _id: id }) : null;
  if (!event || (event.published === false && !includeDraft)) {
    fail(res, 404, "Event not found");
    return null;
  }
  return event;
}

const secretMatches = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/* ---------- public ---------- */

router.get("/", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const now = new Date();
  let events = await db.collection("events").find({ published: { $ne: false } }).sort({ date: 1 }).toArray();
  if (req.query.when === "upcoming") events = events.filter((e) => endOf(e) >= now);
  else if (req.query.when === "past") events = events.filter((e) => endOf(e) < now).reverse();
  const ids = events.map((e) => e._id);
  const t = await tally(db, ids);
  const mine = new Map();
  if (req.user && ids.length) {
    const rows = await db.collection("rsvps").find({ userId: req.user._id, eventId: { $in: ids } }).toArray();
    rows.forEach((r) => mine.set(String(r.eventId), r));
  }
  res.json({ events: events.map((e) => view(e, t.get(String(e._id)), mine.get(String(e._id)))) });
}));

/* ---------- logged-in members ---------- */

router.get("/me/rsvps", requireAuth, wrap(async (req, res) => {
  const db = req.app.locals.db;
  const rows = await db
    .collection("rsvps")
    .find({ userId: req.user._id, status: { $in: ["going", "waitlist"] } })
    .toArray();
  const events = rows.length
    ? await db.collection("events").find({ _id: { $in: rows.map((r) => r.eventId) } }).toArray()
    : [];
  const feedback = await db.collection("feedback").find({ userId: req.user._id }).toArray();
  const items = rows
    .map((r) => {
      const e = events.find((x) => String(x._id) === String(r.eventId));
      return e ? { ...view(e, null, r), feedbackGiven: feedback.some((f) => String(f.eventId) === String(e._id)) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json({ events: items });
}));

/* ---------- officers and admins (defined before "/:id") ---------- */

router.get("/admin/list", requireRole("officer"), wrap(async (req, res) => {
  const db = req.app.locals.db;
  const events = await db.collection("events").find({}).sort({ date: -1 }).toArray();
  const t = await tally(db, events.map((e) => e._id));
  res.json({ events: events.map((e) => view(e, t.get(String(e._id)))) });
}));

router.post("/", requireRole("officer"), wrap(async (req, res) => {
  const { data, error } = parseEvent(req.body);
  if (error) return fail(res, 400, error);
  const doc = {
    ...data,
    checkinSecret: crypto.randomBytes(12).toString("hex"),
    reminderSentAt: null,
    createdBy: req.user._id,
    createdAt: new Date()
  };
  const r = await req.app.locals.db.collection("events").insertOne(doc);
  await audit(req, "event.create", "event", r.insertedId, { title: doc.title });
  res.status(201).json({ event: view({ ...doc, _id: r.insertedId }) });
}));

/* ---------- single event ---------- */

router.get("/:id", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const event = await loadEvent(req, res);
  if (!event) return;
  const t = await tally(db, [event._id]);
  const mine = req.user
    ? await db.collection("rsvps").findOne({ eventId: event._id, userId: req.user._id })
    : null;
  const feedback = await db.collection("feedback").find({ eventId: event._id }).toArray();
  const myFeedback = req.user ? feedback.find((f) => String(f.userId) === String(req.user._id)) : null;
  const avg = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : null;
  res.json({
    event: view(event, t.get(String(event._id)), mine),
    feedback: {
      count: feedback.length,
      average: avg === null ? null : Math.round(avg * 10) / 10,
      mine: myFeedback ? { rating: myFeedback.rating, comment: myFeedback.comment } : null
    }
  });
}));

router.get("/:id/calendar.ics", wrap(async (req, res) => {
  const event = await loadEvent(req, res);
  if (!event) return;
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="event.ics"');
  res.send(eventToIcs(event, `${config.clientUrl}/events/${event._id}`));
}));

router.post("/:id/rsvp", requireAuth, wrap(async (req, res) => {
  const db = req.app.locals.db;
  const event = await loadEvent(req, res);
  if (!event) return;
  if (endOf(event) < new Date()) return fail(res, 400, "This event has already ended");

  const rsvps = db.collection("rsvps");
  const existing = await rsvps.findOne({ eventId: event._id, userId: req.user._id });
  if (existing && existing.status !== "cancelled") return res.json({ status: existing.status });

  const going = await rsvps.countDocuments({ eventId: event._id, status: "going" });
  const status = !event.capacity || going < event.capacity ? "going" : "waitlist";
  const now = new Date();
  if (existing) {
    await rsvps.updateOne(
      { _id: existing._id },
      { $set: { status, waitlistedAt: now, updatedAt: now, attended: false, attendedAt: null } }
    );
  } else {
    try {
      await rsvps.insertOne({
        eventId: event._id, userId: req.user._id, status,
        attended: false, attendedAt: null, waitlistedAt: now, createdAt: now, updatedAt: now
      });
    } catch (err) {
      if (err.code !== 11000) throw err; // double click: the first request already saved it
    }
  }
  await sendMail({
    to: req.user.email,
    subject: status === "going" ? `You're going: ${event.title}` : `You're on the waitlist: ${event.title}`,
    text: status === "going"
      ? `Hi ${req.user.name},\n\nYour place at "${event.title}" is confirmed for ${new Date(event.date).toUTCString()}.\n\n${config.clientUrl}/events/${event._id}\n`
      : `Hi ${req.user.name},\n\n"${event.title}" is full, so you are on the waitlist. We will email you if a place opens up.\n\n${config.clientUrl}/events/${event._id}\n`
  });
  res.status(201).json({ status });
}));

router.delete("/:id/rsvp", requireAuth, wrap(async (req, res) => {
  const db = req.app.locals.db;
  const event = await loadEvent(req, res);
  if (!event) return;
  const rsvps = db.collection("rsvps");
  const mine = await rsvps.findOne({ eventId: event._id, userId: req.user._id });
  if (!mine || mine.status === "cancelled") return fail(res, 404, "You have not registered for this event");
  if (mine.attended) return fail(res, 400, "You are already checked in to this event");
  await rsvps.updateOne({ _id: mine._id }, { $set: { status: "cancelled", updatedAt: new Date() } });
  if (mine.status === "going") await promoteWaitlist(db, event);
  res.json({ status: null });
}));

// Members scan the event QR code on their phone, which opens /checkin/:id/:secret.
router.post("/:id/checkin", requireAuth, wrap(async (req, res) => {
  const db = req.app.locals.db;
  const event = await loadEvent(req, res);
  if (!event) return;
  if (!secretMatches(req.body && req.body.secret, event.checkinSecret)) {
    return fail(res, 400, "This check-in code is not valid. Ask an officer for the current QR code.");
  }
  const now = Date.now();
  if (now < new Date(event.date).getTime() - 3 * HOUR || now > endOf(event).getTime() + 12 * HOUR) {
    return fail(res, 400, "Check-in is not open for this event right now");
  }
  const rsvps = db.collection("rsvps");
  const mine = await rsvps.findOne({ eventId: event._id, userId: req.user._id });
  if (!mine || mine.status !== "going") {
    return fail(res, 400, mine && mine.status === "waitlist"
      ? "You are on the waitlist, so you cannot check in yet"
      : "You need to RSVP to this event first");
  }
  if (!mine.attended) {
    await rsvps.updateOne({ _id: mine._id }, { $set: { attended: true, attendedAt: new Date() } });
  }
  res.json({ message: `You are checked in to ${event.title}. Enjoy!`, eventTitle: event.title });
}));

router.post("/:id/feedback", requireAuth, wrap(async (req, res) => {
  const db = req.app.locals.db;
  const event = await loadEvent(req, res);
  if (!event) return;
  const mine = await db.collection("rsvps").findOne({ eventId: event._id, userId: req.user._id });
  if (!mine || !mine.attended) return fail(res, 403, "Only people who checked in can leave feedback");
  if (new Date(event.date) > new Date()) return fail(res, 400, "Feedback opens once the event has started");
  const rating = Number.parseInt(req.body && req.body.rating, 10);
  if (!(rating >= 1 && rating <= 5)) return fail(res, 400, "Please choose a rating from 1 to 5");
  const comment = str(req.body.comment, 1000);
  const feedback = db.collection("feedback");
  const existing = await feedback.findOne({ eventId: event._id, userId: req.user._id });
  if (existing) await feedback.updateOne({ _id: existing._id }, { $set: { rating, comment, updatedAt: new Date() } });
  else await feedback.insertOne({ eventId: event._id, userId: req.user._id, rating, comment, createdAt: new Date() });
  res.json({ message: "Thank you for your feedback!" });
}));

/* ---------- officers and admins: managing one event ---------- */

router.put("/:id", requireRole("officer"), wrap(async (req, res) => {
  const db = req.app.locals.db;
  const event = await loadEvent(req, res, { includeDraft: true });
  if (!event) return;
  const { data, error } = parseEvent(req.body);
  if (error) return fail(res, 400, error);
  const dateChanged = new Date(data.date).getTime() !== new Date(event.date).getTime();
  await db.collection("events").updateOne(
    { _id: event._id },
    { $set: { ...data, updatedAt: new Date(), ...(dateChanged ? { reminderSentAt: null } : {}) } }
  );
  await audit(req, "event.update", "event", event._id, { title: data.title });
  // A bigger capacity may free places for people on the waitlist.
  await promoteWaitlist(db, { ...event, ...data });
  res.json({ event: view({ ...event, ...data }) });
}));

router.delete("/:id", requireRole("officer"), wrap(async (req, res) => {
  const db = req.app.locals.db;
  const event = await loadEvent(req, res, { includeDraft: true });
  if (!event) return;
  await db.collection("rsvps").deleteMany({ eventId: event._id });
  await db.collection("feedback").deleteMany({ eventId: event._id });
  await db.collection("events").deleteOne({ _id: event._id });
  await audit(req, "event.delete", "event", event._id, { title: event.title });
  res.json({ message: "Event deleted" });
}));

async function attendeeRows(db, eventId) {
  const rows = await db.collection("rsvps").find({ eventId, status: { $in: ["going", "waitlist"] } }).sort({ createdAt: 1 }).toArray();
  const users = rows.length
    ? await db.collection("users").find({ _id: { $in: rows.map((r) => r.userId) } }).toArray()
    : [];
  return rows.map((r) => {
    const u = users.find((x) => String(x._id) === String(r.userId)) || {};
    return {
      userId: String(r.userId), name: u.name || "(deleted)", email: u.email || "",
      affiliation: u.affiliation || "", status: r.status, attended: !!r.attended, rsvpAt: r.createdAt
    };
  });
}

router.get("/:id/admin", requireRole("officer"), wrap(async (req, res) => {
  const db = req.app.locals.db;
  const event = await loadEvent(req, res, { includeDraft: true });
  if (!event) return;
  const [attendees, feedback] = await Promise.all([
    attendeeRows(db, event._id),
    db.collection("feedback").find({ eventId: event._id }).sort({ createdAt: -1 }).toArray()
  ]);
  const t = await tally(db, [event._id]);
  res.json({
    event: view(event, t.get(String(event._id))),
    checkinSecret: event.checkinSecret,
    attendees,
    feedback: feedback.map((f) => ({ rating: f.rating, comment: f.comment, createdAt: f.createdAt }))
  });
}));

router.post("/:id/rotate-secret", requireRole("officer"), wrap(async (req, res) => {
  const event = await loadEvent(req, res, { includeDraft: true });
  if (!event) return;
  const checkinSecret = crypto.randomBytes(12).toString("hex");
  await req.app.locals.db.collection("events").updateOne({ _id: event._id }, { $set: { checkinSecret } });
  await audit(req, "event.rotate-checkin-code", "event", event._id, { title: event.title });
  res.json({ checkinSecret });
}));

// Manual check-in or undo, for people without a phone.
router.patch("/:id/attendance", requireRole("officer"), wrap(async (req, res) => {
  const event = await loadEvent(req, res, { includeDraft: true });
  if (!event) return;
  const userId = toId(req.body && req.body.userId);
  if (!userId) return fail(res, 400, "Invalid member");
  const attended = req.body.attended === true;
  const r = await req.app.locals.db.collection("rsvps").updateOne(
    { eventId: event._id, userId, status: "going" },
    { $set: { attended, attendedAt: attended ? new Date() : null } }
  );
  if (!r.matchedCount) return fail(res, 404, "That member is not confirmed for this event");
  await audit(req, attended ? "event.checkin" : "event.undo-checkin", "event", event._id, { userId: String(userId) });
  res.json({ attended });
}));

router.get("/:id/attendees.csv", requireRole("officer"), wrap(async (req, res) => {
  const event = await loadEvent(req, res, { includeDraft: true });
  if (!event) return;
  const rows = await attendeeRows(req.app.locals.db, event._id);
  await audit(req, "export.attendees", "event", event._id, { title: event.title });
  sendCsv(res, "attendees.csv", toCsv(rows, [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Affiliation", key: "affiliation" },
    { label: "Status", key: "status" },
    { label: "Checked in", value: (r) => (r.attended ? "Yes" : "No") },
    { label: "RSVP date", key: "rsvpAt" }
  ]));
}));

module.exports = router;
