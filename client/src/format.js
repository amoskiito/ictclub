const pad = (n) => String(n).padStart(2, "0");
const HOUR = 3600 * 1000;

export const endOf = (e) => (e.endDate ? new Date(e.endDate) : new Date(new Date(e.date).getTime() + 2 * HOUR));
export const isPast = (e) => endOf(e) < new Date();
export const hasStarted = (e) => new Date(e.date) <= new Date();

export const fmtDate = (iso, opts) =>
  new Date(iso).toLocaleDateString(undefined, opts || { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
export const fmtDateTime = (iso) => `${fmtDate(iso)}, ${fmtTime(iso)}`;

// "Sat, 5 Dec 2026 · 14:00 – 16:00"
export function eventWhen(e) {
  const start = new Date(e.date);
  const end = endOf(e);
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${fmtDate(start)} · ${fmtTime(start)} – ${fmtTime(end)}`
    : `${fmtDateTime(start)} → ${fmtDateTime(end)}`;
}

// <input type="datetime-local"> works in local time without a timezone.
export function toInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const fromInputValue = (v) => (v ? new Date(v).toISOString() : "");

const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(e) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(new Date(e.date))}/${stamp(endOf(e))}`,
    details: `${e.description || ""}\n\n${window.location.origin}/events/${e.id}`,
    location: e.location || ""
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";

export function spotsLabel(e) {
  if (!e.capacity) return "Open to all";
  const left = e.capacity - e.going;
  return left > 0 ? `${left} spot${left === 1 ? "" : "s"} left` : "Full · waitlist open";
}
