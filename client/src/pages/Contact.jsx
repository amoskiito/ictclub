import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageHead, Alert, useTitle } from "../components/ui";
import { site } from "../siteConfig";

export default function Contact() {
  useTitle("Contact");
  const [form, setForm] = useState({ name: "", email: "", message: "", consent: false, website: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/contact", { method: "POST", body: form });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const { lat, lng } = site.map;
  const bbox = [lng - 0.012, lat - 0.007, lng + 0.012, lat + 0.007].join("%2C");
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="container">
      <PageHead title="Contact us" sub="Questions, ideas or partnership offers? We would love to hear from you." />
      <div className="grid-2 contact-grid">
        {sent ? (
          <div className="card center">
            <div className="big-emoji" aria-hidden="true">💌</div>
            <h2>Message sent!</h2>
            <p>Thank you, {form.name.split(" ")[0]}. We will reply to {form.email} soon.</p>
            <button className="btn btn-light" onClick={() => { setSent(false); setForm({ name: "", email: "", message: "", consent: false, website: "" }); }}>
              Send another message
            </button>
          </div>
        ) : (
          <form className="card" onSubmit={submit}>
            <label className="field-label" htmlFor="c-name">Your name</label>
            <input id="c-name" className="input" required minLength={2} maxLength={80} value={form.name} onChange={set("name")} autoComplete="name" />

            <label className="field-label" htmlFor="c-email">Email</label>
            <input id="c-email" type="email" className="input" required value={form.email} onChange={set("email")} autoComplete="email" />

            <label className="field-label" htmlFor="c-msg">Message</label>
            <textarea id="c-msg" className="textarea" rows="6" required minLength={10} maxLength={2000} value={form.message} onChange={set("message")} />
            <p className="muted small">{form.message.length}/2000</p>

            {/* Hidden field that only bots fill in */}
            <div className="hp" aria-hidden="true">
              <label>Website<input tabIndex="-1" autoComplete="off" value={form.website} onChange={set("website")} /></label>
            </div>

            <label className="consent-row light">
              <input type="checkbox" required checked={form.consent} onChange={set("consent")} />
              <span>I agree to the <Link to="/privacy" target="_blank">privacy policy</Link> and that the club may use my details to reply.</span>
            </label>

            <Alert>{error}</Alert>
            <button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
          </form>
        )}

        <div>
          <div className="card">
            <h2>Find us</h2>
            <p>📍 {site.address}</p>
            <p>✉️ <a href={`mailto:${site.email}`}>{site.email}</a></p>
            <p>📞 {site.phone}</p>
          </div>
          <div className="card map-card">
            <iframe title="Map showing where the club meets" src={mapSrc} loading="lazy" />
            <a className="small" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`} target="_blank" rel="noopener noreferrer">
              View larger map ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
