require("dotenv").config({ quiet: true });

const isProd = process.env.NODE_ENV === "production";

const config = {
  isProd,
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017",
  mongoDb: process.env.MONGO_DB || "class_demo",
  jwtSecret: process.env.JWT_SECRET,
  usingDevSecret: false,
  clientUrl: (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, ""),
  adminEmail: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  contactEmail: (process.env.CONTACT_EMAIL || "").trim(),
  allowedEmailDomains: (process.env.ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "ICT Club <no-reply@example.com>"
  }
};

if (!config.jwtSecret) {
  if (isProd) {
    throw new Error("JWT_SECRET must be set in production (see server/.env.example)");
  }
  // Development convenience only. Never use this value on a real site.
  config.jwtSecret = "dev-only-secret-change-me";
  config.usingDevSecret = true;
}

module.exports = config;
