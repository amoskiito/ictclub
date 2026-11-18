const express = require("express");
const { wrap, fail, toId } = require("../lib/http");
const { str } = require("../lib/validate");
const { ROLES, publicUser, requireRole } = require("../lib/auth");
const { audit } = require("../lib/audit");
const { removeUserRsvps } = require("../lib/rsvp");
const { toCsv, sendCsv } = require("../lib/csv");

const router = express.Router();

/* ---------- charts and totals (officers and admins) ---------- */

router.get("/analytics", requireRole("officer"), wrap(async (req, res) => {
  const db = req.app.locals.db;
  const now = new Date();

  const users = await db.collection("users").find({}, { projection: { createdAt: 1, role: 1 } }).toArray();
  const growth = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    growth.push({
      month: start.toISOString().slice(0, 7),
      joined: users.filter((u) => u.createdAt >= start && u.createdAt < end).length,
      total: users.filter((u) => u.createdAt < end).length
    });
  }

  const events = await db.collection("events").find({ date: { $lte: now } }).sort({ date: -1 }).limit(10).toArray();
  events.reverse();
  const ids = events.map((e) => e._id);
  const rsvps = ids.length ? await db.collection("rsvps").find({ eventId: { $in: ids } }).toArray() : [];
  const feedback = ids.length ? await db.collection("feedback").find({ eventId: { $in: ids } }).toArray() : [];
  const perEvent = events.map((e) => {
    const mine = rsvps.filter((r) => String(r.eventId) === String(e._id));
    const fb = feedback.filter((f) => String(f.eventId) === String(e._id));
    return {
      id: String(e._id),
      title: e.title,
      date: e.date,
      going: mine.filter((r) => r.status === "going").length,
      attended: mine.filter((r) => r.attended).length,
      ratings: fb.length,
      averageRating: fb.length ? Math.round((fb.reduce((s, f) => s + f.rating, 0) / fb.length) * 10) / 10 : null
    };
  });

  const [totalEvents, unread] = await Promise.all([
    db.collection("events").countDocuments({}),
    db.collection("messages").countDocuments({ handled: false })
  ]);
  res.json({
    totals: {
      members: users.length,
      officers: users.filter((u) => u.role === "officer").length,
      admins: users.filter((u) => u.role === "admin").length,
      events: totalEvents,
      unreadMessages: unread
    },
    growth,
    perEvent
  });
}));

/* ---------- admins only ---------- */

router.get("/users", requireRole("admin"), wrap(async (req, res) => {
  const q = str(req.query.q, 80).toLowerCase();
  let list = await req.app.locals.db.collection("users").find({}).sort({ createdAt: -1 }).limit(1000).toArray();
  if (q) list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.includes(q));
  res.json({ users: list.map(publicUser) });
}));

router.patch("/users/:id/role", requireRole("admin"), wrap(async (req, res) => {
  const id = toId(req.params.id);
  const role = req.body && req.body.role;
  if (!id || !ROLES.includes(role)) return fail(res, 400, "Invalid user or role");
  if (String(id) === String(req.user._id)) return fail(res, 400, "You cannot change your own role");
  const users = req.app.locals.db.collection("users");
  const target = await users.findOne({ _id: id });
  if (!target) return fail(res, 404, "User not found");
  await users.updateOne({ _id: id }, { $set: { role } });
  await audit(req, "user.role", "user", id, { email: target.email, from: target.role, to: role });
  res.json({ role });
}));

router.delete("/users/:id", requireRole("admin"), wrap(async (req, res) => {
  const db = req.app.locals.db;
  const id = toId(req.params.id);
  if (!id) return fail(res, 404, "User not found");
  if (String(id) === String(req.user._id)) return fail(res, 400, "Use your profile page to delete your own account");
  const target = await db.collection("users").findOne({ _id: id });
  if (!target) return fail(res, 404, "User not found");
  await removeUserRsvps(db, id);
  await db.collection("feedback").deleteMany({ userId: id });
  await db.collection("tokens").deleteMany({ userId: id });
  await db.collection("users").deleteOne({ _id: id });
  await audit(req, "user.delete", "user", id, { email: target.email });
  res.json({ message: "User deleted" });
}));

router.get("/export/members.csv", requireRole("admin"), wrap(async (req, res) => {
  const users = await req.app.locals.db.collection("users").find({}).sort({ createdAt: 1 }).toArray();
  await audit(req, "export.members", "user", null, { count: users.length });
  sendCsv(res, "members.csv", toCsv(users, [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Role", key: "role" },
    { label: "Affiliation", key: "affiliation" },
    { label: "Year", key: "year" },
    { label: "Skills", value: (u) => (u.skills || []).join("; ") },
    { label: "Email verified", value: (u) => (u.emailVerified ? "Yes" : "No") },
    { label: "Joined", key: "createdAt" }
  ]));
}));

router.get("/audit", requireRole("admin"), wrap(async (req, res) => {
  const logs = await req.app.locals.db.collection("auditLogs").find({}).sort({ createdAt: -1 }).limit(300).toArray();
  res.json({
    logs: logs.map((l) => ({
      id: String(l._id), actor: l.actorName, email: l.actorEmail, action: l.action,
      targetType: l.targetType, targetId: l.targetId, details: l.details || {}, createdAt: l.createdAt
    }))
  });
}));

module.exports = router;
