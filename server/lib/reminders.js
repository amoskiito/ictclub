const { sendMail } = require("./mailer");
const config = require("./config");

// Emails everyone who is "going" once, about 24 hours before an event starts.
async function runReminders(db) {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 3600 * 1000);
  const events = await db
    .collection("events")
    .find({ published: { $ne: false }, reminderSentAt: null, date: { $gt: now, $lte: soon } })
    .toArray();
  for (const event of events) {
    const going = await db.collection("rsvps").find({ eventId: event._id, status: "going" }).toArray();
    const ids = going.map((r) => r.userId);
    const users = ids.length ? await db.collection("users").find({ _id: { $in: ids } }).toArray() : [];
    for (const u of users) {
      await sendMail({
        to: u.email,
        subject: `Reminder: ${event.title} is tomorrow`,
        text: `Hi ${u.name},\n\nA reminder that "${event.title}" starts on ${new Date(event.date).toUTCString()}${event.location ? ` at ${event.location}` : ""}.\n\nDetails: ${config.clientUrl}/events/${event._id}\n`
      });
    }
    await db.collection("events").updateOne({ _id: event._id }, { $set: { reminderSentAt: new Date() } });
  }
  return events.length;
}

function startReminderJob(db) {
  const tick = () => runReminders(db).catch((e) => console.error("Reminder job failed:", e.message));
  setTimeout(tick, 15 * 1000);
  return setInterval(tick, 10 * 60 * 1000);
}

module.exports = { runReminders, startReminderJob };
