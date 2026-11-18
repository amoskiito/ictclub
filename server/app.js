const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./lib/config");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const contentRoutes = require("./routes/content");
const adminRoutes = require("./routes/admin");
const registrationRoutes = require("./routes/registrations");
const { publicRouter, contactRouter, messagesRouter } = require("./routes/misc");

// The app is built from a database handle so tests can plug in an in-memory one.
function createApp(db) {
  const app = express();
  app.locals.db = db;

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  const allowed = new Set([config.clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"]);
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || allowed.has(origin)),
      exposedHeaders: ["Content-Disposition"]
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (req, res) => res.json({ ok: true }));
  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/events", eventRoutes);
  app.use("/content", contentRoutes);
  app.use("/public", publicRouter);
  app.use("/contact", contactRouter);
  app.use("/admin/messages", messagesRouter);
  app.use("/admin", adminRoutes);
  app.use("/registrations", registrationRoutes);

  app.use((req, res) => res.status(404).json({ message: "Not found" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid request body" });
    if (err.type === "entity.too.large") return res.status(413).json({ message: "Request is too large" });
    console.error(err);
    res.status(500).json({ message: "Something went wrong on the server" });
  });

  return app;
}

module.exports = { createApp };
