const nodemailer = require("nodemailer");
const config = require("./config");

const transport = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
    })
  : null;

// In development (no SMTP settings) emails are printed to the server terminal.
// The last few are also kept in memory so tests can read them.
const outbox = [];

async function sendMail({ to, subject, text }) {
  if (!transport) {
    outbox.push({ to, subject, text });
    if (outbox.length > 50) outbox.shift();
    if (process.env.NODE_ENV !== "test") {
      console.log(`\n[email - not sent, no SMTP configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    }
    return;
  }
  try {
    await transport.sendMail({ from: config.smtp.from, to, subject, text });
  } catch (err) {
    console.error("Email failed:", err.message);
  }
}

module.exports = { sendMail, outbox };
