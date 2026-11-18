const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const config = require("../lib/config");
const { wrap, fail } = require("../lib/http");
const { str, oneOf, EMAIL_RE, passwordProblem } = require("../lib/validate");
const { signToken, publicUser, requireAuth } = require("../lib/auth");
const { createToken, consumeToken } = require("../lib/tokens");
const { sendMail } = require("../lib/mailer");

const router = express.Router();
const AFFILIATIONS = ["Student", "Lecturer", "Alumni", "Guest"];
const HOUR = 3600 * 1000;

// Slows down password guessing and sign-up spam.
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: { message: "Too many attempts. Please try again in a few minutes." }
  })
);

async function sendVerification(db, user) {
  const raw = await createToken(db, user._id, "verify", 48 * HOUR);
  await sendMail({
    to: user.email,
    subject: "Verify your ICT Club email",
    text: `Hi ${user.name},\n\nPlease confirm your email address:\n${config.clientUrl}/verify-email/${raw}\n\nThis link works for 48 hours.\n`
  });
}

router.post("/signup", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const b = req.body || {};
  const name = str(b.name, 80);
  const email = str(b.email, 200).toLowerCase();

  if (name.length < 2) return fail(res, 400, "Please enter your full name");
  if (!EMAIL_RE.test(email)) return fail(res, 400, "Please enter a valid email address");
  const problem = passwordProblem(b.password);
  if (problem) return fail(res, 400, problem);
  if (b.consent !== true) return fail(res, 400, "You must accept the privacy policy to join");
  if (config.allowedEmailDomains.length && !config.allowedEmailDomains.includes(email.split("@")[1])) {
    return fail(res, 400, `Please use your school email (${config.allowedEmailDomains.map((d) => "@" + d).join(", ")})`);
  }

  const users = db.collection("users");
  if (await users.findOne({ email })) return fail(res, 409, "Email already registered");

  const total = await users.countDocuments({});
  const user = {
    name,
    email,
    password: await bcrypt.hash(b.password, 10),
    // The very first account (or ADMIN_EMAIL) becomes the admin.
    role: total === 0 || email === config.adminEmail ? "admin" : "member",
    affiliation: oneOf(b.affiliation, AFFILIATIONS, "Student"),
    year: "",
    skills: [],
    links: { github: "", linkedin: "", website: "" },
    bio: "",
    directoryOptIn: false,
    emailVerified: false,
    consentAt: new Date(),
    createdAt: new Date()
  };
  try {
    await users.insertOne(user);
  } catch (err) {
    if (err.code === 11000) return fail(res, 409, "Email already registered");
    throw err;
  }
  await sendVerification(db, user);
  res.status(201).json({ message: "Signup successful" });
}));

router.post("/login", wrap(async (req, res) => {
  const email = str(req.body && req.body.email, 200).toLowerCase();
  const password = req.body && req.body.password;
  if (!email || typeof password !== "string" || !password) {
    return fail(res, 400, "Email and password are required");
  }
  const user = await req.app.locals.db.collection("users").findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return fail(res, 401, "Invalid email or password");
  }
  res.json({ message: "Login successful", token: signToken(user), user: publicUser(user) });
}));

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.post("/verify-email", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const doc = await consumeToken(db, req.body && req.body.token, "verify");
  if (!doc) return fail(res, 400, "This verification link is invalid or has expired");
  await db.collection("users").updateOne({ _id: doc.userId }, { $set: { emailVerified: true } });
  res.json({ message: "Email verified. Thank you!" });
}));

router.post("/resend-verification", requireAuth, wrap(async (req, res) => {
  if (req.user.emailVerified) return res.json({ message: "Your email is already verified" });
  await sendVerification(req.app.locals.db, req.user);
  res.json({ message: "Verification email sent. Check your inbox." });
}));

// Always answers the same way, so nobody can find out which emails have accounts.
router.post("/forgot", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const email = str(req.body && req.body.email, 200).toLowerCase();
  const user = EMAIL_RE.test(email) ? await db.collection("users").findOne({ email }) : null;
  if (user) {
    const raw = await createToken(db, user._id, "reset", HOUR);
    await sendMail({
      to: user.email,
      subject: "Reset your ICT Club password",
      text: `Hi ${user.name},\n\nUse this link to choose a new password (valid for 1 hour):\n${config.clientUrl}/reset-password/${raw}\n\nIf you did not ask for this, you can ignore this email.\n`
    });
  }
  res.json({ message: "If that email has an account, a reset link is on its way." });
}));

router.post("/reset", wrap(async (req, res) => {
  const db = req.app.locals.db;
  const problem = passwordProblem(req.body && req.body.password);
  if (problem) return fail(res, 400, problem);
  const doc = await consumeToken(db, req.body.token, "reset");
  if (!doc) return fail(res, 400, "This reset link is invalid or has expired");
  await db.collection("users").updateOne(
    { _id: doc.userId },
    { $set: { password: await bcrypt.hash(req.body.password, 10) } }
  );
  await db.collection("tokens").deleteMany({ userId: doc.userId, type: "reset" });
  res.json({ message: "Password updated. You can log in now." });
}));

module.exports = router;
