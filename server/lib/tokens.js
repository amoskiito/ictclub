const crypto = require("crypto");

const hash = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

// One-time tokens for email verification and password reset.
// Only a hash is stored, so a leaked database cannot be used to reset passwords.
async function createToken(db, userId, type, ttlMs) {
  const raw = crypto.randomBytes(32).toString("hex");
  await db.collection("tokens").insertOne({
    userId,
    type,
    hash: hash(raw),
    expiresAt: new Date(Date.now() + ttlMs),
    createdAt: new Date()
  });
  return raw;
}

async function consumeToken(db, raw, type) {
  if (typeof raw !== "string" || raw.length < 20) return null;
  const tokens = db.collection("tokens");
  const doc = await tokens.findOne({ hash: hash(raw), type, expiresAt: { $gt: new Date() } });
  if (!doc) return null;
  await tokens.deleteOne({ _id: doc._id });
  return doc;
}

module.exports = { createToken, consumeToken };
