// Records who did what. Never throws, so a logging problem cannot break a request.
async function audit(req, action, targetType, targetId, details = {}) {
  try {
    await req.app.locals.db.collection("auditLogs").insertOne({
      actorId: req.user._id,
      actorName: req.user.name,
      actorEmail: req.user.email,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      details,
      createdAt: new Date()
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}

module.exports = { audit };
