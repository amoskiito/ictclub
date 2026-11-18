const { ObjectId } = require("mongodb");

// Express 4 does not catch errors thrown in async handlers, so wrap them.
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const fail = (res, status, message) => res.status(status).json({ message });

// Only accept real 24-character hex ids (ObjectId.isValid also accepts any 12-char string).
function toId(value) {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value)
    ? new ObjectId(value)
    : null;
}

module.exports = { wrap, fail, toId };
