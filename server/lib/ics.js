const pad = (n) => String(n).padStart(2, "0");
const stamp = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
  `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const esc = (s) =>
  String(s || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

// A calendar file that works with Google, Apple and Outlook calendars.
function eventToIcs(event, pageUrl) {
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 2 * 3600 * 1000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ICT Club//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event._id}@ictclub`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(event.title)}`,
    `DESCRIPTION:${esc((event.description || "") + (pageUrl ? `\n\n${pageUrl}` : ""))}`,
    `LOCATION:${esc(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

module.exports = { eventToIcs };
