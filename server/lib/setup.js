const { ROLES } = require("./auth");
const config = require("./config");

// Runs once at start-up: indexes, upgrading old data, and the first admin.
async function ensureSetup(db) {
  const unique = async (name, keys) => {
    try {
      await db.collection(name).createIndex(keys, { unique: true });
    } catch (err) {
      console.warn(`Could not create unique index on ${name}:`, err.message);
    }
  };
  await unique("users", { email: 1 });
  await unique("rsvps", { eventId: 1, userId: 1 });
  await unique("feedback", { eventId: 1, userId: 1 });

  // Earlier versions stored "Student / Lecturer / Alumni / Guest" in the "role" field.
  // Move that into "affiliation" and make everyone a normal member.
  const users = db.collection("users");
  const legacy = await users.find({ role: { $nin: ROLES } }).toArray();
  for (const u of legacy) {
    const set = { role: "member" };
    if (typeof u.role === "string" && u.role) set.affiliation = u.role;
    await users.updateOne({ _id: u._id }, { $set: set });
  }
  if (legacy.length) console.log(`Upgraded ${legacy.length} existing user(s) to the new role system.`);

  if (config.adminEmail) {
    const r = await users.updateOne({ email: config.adminEmail }, { $set: { role: "admin" } });
    if (r.matchedCount) console.log(`${config.adminEmail} is an admin.`);
  }
  const admins = await users.countDocuments({ role: "admin" });
  if (!admins) {
    console.log("No admin yet: set ADMIN_EMAIL in server/.env, or run: npm run make-admin -- your@email.com");
  }
}

module.exports = { ensureSetup };
