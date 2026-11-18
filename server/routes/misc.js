const express = require("express");
const rateLimit = require("express-rate-limit");
const config = require("../lib/config");
const { wrap, fail, toId } = require("../lib/http");
const { str, EMAIL_RE } = require("../lib/validate");
const { requireRole } = require("../lib/auth");
const { audit } = require("../lib/audit");
const { sendMail } = require("../lib/mailer");

const publicRouter = express.Router();
const contactRouter = express.Router();
const messagesRouter = express.Router();

/* ---------- live numbers for the home page ---------- */

publicRouter.get("/stats", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const now = new Date();
  const [members, events, going, checkedIn] = await Promise.all([
    db.collection("users").countDocuments({}),
    db.collection("events").find({ published: { $ne: false } }).toArray(),
    db.collection("rsvps").countDocuments({ status: "going" }),
    db.collection("rsvps").countDocuments({ attended: true })
  ]);
  const endOf = (e) => (e.endDate ? new Date(e.endDate) : new Date(new Date(e.date).getTime() + 2 * 3600 * 1000));
  res.json({
    members,
    upcomingEvents: events.filter((e) => endOf(e) >= now).length,
    eventsHeld: events.filter((e) => endOf(e) < now).length,
    rsvps: going,
    checkIns: checkedIn
  });
}));

/* ---------- contact form ---------- */

contactRouter.use(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: { message: "You have sent several messages already. Please try again later." }
  })
);

contactRouter.post("/", wrap(async (req, res) => {
  const b = req.body || {};
  // Hidden "website" field: real people leave it empty, simple bots fill it in.
  if (str(b.website, 100)) return res.status(201).json({ message: "Thank you! We will get back to you soon." });

  const name = str(b.name, 80);
  const email = str(b.email, 200).toLowerCase();
  const message = str(b.message, 2000);
  if (name.length < 2) return fail(res, 400, "Please enter your name");
  if (!EMAIL_RE.test(email)) return fail(res, 400, "Please enter a valid email address");
  if (message.length < 10) return fail(res, 400, "Your message should be at least 10 characters");
  if (b.consent !== true) return fail(res, 400, "Please agree to the privacy policy so we can reply to you");

  await req.app.locals.db.collection("messages").insertOne({ name, email, message, handled: false, createdAt: new Date() });
  if (config.contactEmail) {
    await sendMail({
      to: config.contactEmail,
      subject: `New message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}\n`
    });
  }
  res.status(201).json({ message: "Thank you! We will get back to you soon." });
}));

/* ---------- inbox for officers and admins ---------- */

messagesRouter.use(requireRole("officer"));

messagesRouter.get("/", wrap(async (req, res) => {
  const items = await req.app.locals.db.collection("messages").find({}).sort({ createdAt: -1 }).limit(300).toArray();
  res.json({ items: items.map(({ _id, ...m }) => ({ id: String(_id), ...m })) });
}));

messagesRouter.patch("/:id", wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return fail(res, 404, "Not found");
  const r = await req.app.locals.db.collection("messages").updateOne(
    { _id: id },
    { $set: { handled: req.body && req.body.handled === true } }
  );
  if (!r.matchedCount) return fail(res, 404, "Not found");
  res.json({ handled: req.body.handled === true });
}));

messagesRouter.delete("/:id", wrap(async (req, res) => {
  const id = toId(req.params.id);
  const r = id ? await req.app.locals.db.collection("messages").deleteOne({ _id: id }) : { deletedCount: 0 };
  if (!r.deletedCount) return fail(res, 404, "Not found");
  await audit(req, "message.delete", "message", id);
  res.json({ message: "Deleted" });
}));

module.exports = { publicRouter, contactRouter, messagesRouter };
