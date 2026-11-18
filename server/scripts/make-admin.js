// Usage:  npm run make-admin -- you@example.com
const { MongoClient } = require("mongodb");
const config = require("../lib/config");

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.log("Usage: npm run make-admin -- you@example.com");
  process.exit(1);
}

(async () => {
  const client = new MongoClient(config.mongoUri);
  try {
    await client.connect();
    const result = await client
      .db(config.mongoDb)
      .collection("users")
      .updateOne({ email }, { $set: { role: "admin" } });
    console.log(
      result.matchedCount
        ? `${email} is now an admin. Log out and log in again in the browser.`
        : "No user found with that email. Sign up on the website first, then run this again."
    );
  } finally {
    await client.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
