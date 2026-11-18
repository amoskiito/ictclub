const jwt = require("jsonwebtoken");
const config = require("./config");
const { wrap, fail, toId } = require("./http");

const ROLES = ["member", "officer", "admin"];
const RANK = { member: 1, officer: 2, admin: 3 };

function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: "7d" });
}

// Only fields that are safe to send to the browser (never the password hash).
function publicUser(u) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    affiliation: u.affiliation || "Student",
    year: u.year || "",
    skills: u.skills || [],
    links: { github: "", linkedin: "", website: "", ...(u.links || {}) },
    bio: u.bio || "",
    directoryOptIn: !!u.directoryOptIn,
    emailVerified: !!u.emailVerified,
    createdAt: u.createdAt
  };
}

async function loadUser(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ["HS256"] });
    const id = toId(payload.sub);
    if (!id) return null;
    // Loaded fresh every time, so role changes and deletions take effect immediately.
    return await req.app.locals.db.collection("users").findOne({ _id: id });
  } catch {
    return null;
  }
}

const authOptional = wrap(async (req, res, next) => {
  req.user = await loadUser(req);
  next();
});

const requireAuth = wrap(async (req, res, next) => {
  if (!req.user) req.user = await loadUser(req);
  if (!req.user) return fail(res, 401, "Please log in to continue");
  next();
});

function requireRole(min) {
  return wrap(async (req, res, next) => {
    if (!req.user) req.user = await loadUser(req);
    if (!req.user) return fail(res, 401, "Please log in to continue");
    if ((RANK[req.user.role] || 1) < RANK[min]) {
      return fail(res, 403, "You do not have permission to do that");
    }
    next();
  });
}

module.exports = { ROLES, RANK, signToken, publicUser, authOptional, requireAuth, requireRole };
