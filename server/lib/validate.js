const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(value, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Only http(s) links are kept, which blocks javascript: and data: URLs.
function url(value) {
  const s = str(value, 500);
  return /^https?:\/\/[^\s]+$/i.test(s) ? s : "";
}

function strList(value, maxItems = 20, maxLen = 40) {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const out = [];
  for (const item of raw) {
    const s = str(item, maxLen);
    if (s && !out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function oneOf(value, list, fallback) {
  return list.includes(value) ? value : fallback;
}

function intIn(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function passwordProblem(pw) {
  if (typeof pw !== "string" || pw.length < 8) return "Password must be at least 8 characters";
  if (pw.length > 128) return "Password is too long";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must contain a letter and a number";
  return null;
}

// Validates a request body against a small schema and returns clean data.
function parseFields(schema, body) {
  const data = {};
  const b = body || {};
  for (const [key, rule] of Object.entries(schema)) {
    let v = b[key];
    switch (rule.t) {
      case "str": v = str(v, rule.max || 200); break;
      case "url": v = url(v); break;
      case "bool": v = typeof v === "boolean" ? v : rule.def === true; break;
      case "int": v = intIn(v, rule.min ?? 0, rule.max ?? 100000, rule.def ?? 0); break;
      case "enum": v = oneOf(v, rule.values, rule.def ?? rule.values[0]); break;
      case "images":
        v = (Array.isArray(v) ? v : [])
          .slice(0, 40)
          .map((i) => ({ url: url(i && i.url), caption: str(i && i.caption, 120) }))
          .filter((i) => i.url);
        break;
      default: v = "";
    }
    if (rule.req && (v === "" || v == null)) {
      return { error: `${rule.label || key} is required` };
    }
    data[key] = v;
  }
  return { data };
}

module.exports = { EMAIL_RE, str, url, strList, oneOf, intIn, toDate, passwordProblem, parseFields };
