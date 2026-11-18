const express = require("express");
const bcrypt = require("bcryptjs");
const { wrap, fail } = require("../lib/http");
const { str, url, strList, oneOf } = require("../lib/validate");
const { publicUser, requireAuth } = require("../lib/auth");
const { removeUserRsvps } = require("../lib/rsvp");

const router = express.Router();
const AFFILIATIONS = ["Student", "Lecturer", "Alumni", "Guest"];

router.use(requireAuth);

router.get("/me", (req, res) => res.json({ user: publicUser(req.user) }));

router.put("/me", wrap(async (req, res) => {
  const b = req.body || {};
  const name = str(b.name, 80);
  if (name.length < 2) return fail(res, 400, "Name must be at least 2 characters");
  const links = b.links || {};
  const set = {
    name,
    affiliation: oneOf(b.affiliation, AFFILIATIONS, req.user.affiliation || "Student"),
    year: str(b.year, 20),
    skills: strList(b.skills, 15, 30),
    links: { github: url(links.github), linkedin: url(links.linkedin), website: url(links.website) },
    bio: str(b.bio, 500),
    directoryOptIn: b.directoryOptIn === true,
    updatedAt: new Date()
  };
  const users = req.app.locals.db.collection("users");
  await users.updateOne({ _id: req.user._id }, { $set: set });
  res.json({ user: publicUser(await users.findOne({ _id: req.user._id })) });
}));

// Everything the club stores about the member, as a JSON download.
router.get("/me/export", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const rsvps = await db.collection("rsvps").find({ userId: req.user._id }).toArray();
  const events = rsvps.length
    ? await db.collection("events").find({ _id: { $in: rsvps.map((r) => r.eventId) } }).toArray()
    : [];
  const feedback = await db.collection("feedback").find({ userId: req.user._id }).toArray();
  const title = (id) => (events.find((e) => String(e._id) === String(id)) || {}).title || "";
  const payload = {
    exportedAt: new Date().toISOString(),
    profile: { ...publicUser(req.user), consentAcceptedAt: req.user.consentAt || null },
    rsvps: rsvps.map((r) => ({
      event: title(r.eventId), status: r.status, attended: !!r.attended, createdAt: r.createdAt
    })),
    feedback: feedback.map((f) => ({
      event: title(f.eventId), rating: f.rating, comment: f.comment, createdAt: f.createdAt
    }))
  };
  res.setHeader("Content-Disposition", 'attachment; filename="my-ict-club-data.json"');
  res.json(payload);
}));

router.delete("/me", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const password = req.body && req.body.password;
  if (typeof password !== "string" || !(await bcrypt.compare(password, req.user.password))) {
    return fail(res, 400, "Password is incorrect");
  }
  if (req.user.role === "admin") {
    const admins = await db.collection("users").countDocuments({ role: "admin" });
    if (admins <= 1) return fail(res, 400, "You are the only admin. Make someone else an admin first.");
  }
  await removeUserRsvps(db, req.user._id);
  await db.collection("feedback").deleteMany({ userId: req.user._id });
  await db.collection("tokens").deleteMany({ userId: req.user._id });
  await db.collection("users").deleteOne({ _id: req.user._id });
  res.json({ message: "Your account and personal data have been deleted" });
}));

// Only members who opted in appear, and only other logged-in members can see the list.
router.get("/directory", wrap(async (req, res) => {
  const q = str(req.query.q, 60).toLowerCase();
  let list = await req.app.locals.db
    .collection("users")
    .find({ directoryOptIn: true })
    .sort({ name: 1 })
    .toArray();
  if (q) {
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  }
  res.json({
    members: list.map((u) => ({
      id: String(u._id),
      name: u.name,
      affiliation: u.affiliation || "Student",
      year: u.year || "",
      skills: u.skills || [],
      bio: u.bio || "",
      links: u.links || {}
    }))
  });
}));

module.exports = router;
