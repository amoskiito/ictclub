const { MongoClient } = require("mongodb");
const config = require("./lib/config");
const { createApp } = require("./app");
const { ensureSetup } = require("./lib/setup");
const { startReminderJob } = require("./lib/reminders");

async function start() {
  if (config.usingDevSecret) {
    console.warn("WARNING: JWT_SECRET is not set, using an insecure development secret. Copy server/.env.example to server/.env and set one.");
  }
  const client = new MongoClient(config.mongoUri);
  try {
    await client.connect();
    const db = client.db(config.mongoDb);
    await ensureSetup(db);
    createApp(db).listen(config.port, () => console.log(`Server running on port ${config.port}`));
    startReminderJob(db);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

start();
