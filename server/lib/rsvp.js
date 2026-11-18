const { sendMail } = require("./mailer");
const config = require("./config");

// Moves people from the waitlist to "going" while there is room.
async function promoteWaitlist(db, event) {
  const rsvps = db.collection("rsvps");
  for (;;) {
    const going = await rsvps.countDocuments({ eventId: event._id, status: "going" });
    if (event.capacity && going >= event.capacity) break;
    const next = await rsvps
      .find({ eventId: event._id, status: "waitlist" })
      .sort({ waitlistedAt: 1 })
      .limit(1)
      .toArray();
    if (!next.length) break;
    const now = new Date();
    await rsvps.updateOne({ _id: next[0]._id }, { $set: { status: "going", promotedAt: now, updatedAt: now } });
    const user = await db.collection("users").findOne({ _id: next[0].userId });
    if (user) {
      await sendMail({
        to: user.email,
        subject: `A spot opened up: ${event.title}`,
        text: `Hi ${user.name},\n\nGood news! A place opened up and you are now confirmed for "${event.title}" on ${new Date(event.date).toUTCString()}.\n\nSee the event: ${config.clientUrl}/events/${event._id}\n`
      });
    }
  }
}

// Removes every RSVP of a user (account deletion) and gives freed places to the waitlist.
async function removeUserRsvps(db, userId) {
  const rsvps = db.collection("rsvps");
  const mine = await rsvps.find({ userId }).toArray();
  await rsvps.deleteMany({ userId });
  const eventIds = [...new Set(mine.filter((r) => r.status === "going").map((r) => String(r.eventId)))];
  for (const key of eventIds) {
    const event = await db.collection("events").findOne({ _id: mine.find((r) => String(r.eventId) === key).eventId });
    if (event) await promoteWaitlist(db, event);
  }
}

module.exports = { promoteWaitlist, removeUserRsvps };
