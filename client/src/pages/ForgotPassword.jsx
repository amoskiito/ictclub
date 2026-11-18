import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { MailIcon } from "../components/GlassIcons";
import { useTitle } from "../components/ui";
import "../components/auth.css";

export default function ForgotPassword() {
  useTitle("Forgot password");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const d = await api("/auth/forgot", { method: "POST", body: { email } });
      setDone(d.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-stage signup-stage">
      <span className="glow g1" /><span className="glow g2" />
      <div className="signup-wrap">
        <form className="dark-card" onSubmit={submit}>
          <h2>Forgot your password?</h2>
          <p className="dark-lead">Enter your email and we will send you a link to choose a new one.</p>
          {done ? (
            <p className="glass-msg ok">{done}</p>
          ) : (
            <div className="inner-panel">
              <label className="dl" htmlFor="fp-email">Email address</label>
              <div className="dark-input">
                <span className="gi-icon"><MailIcon /></span>
                <input id="fp-email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="join-btn" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
              {error && <p className="glass-msg error">{error}</p>}
            </div>
          )}
          <p className="dark-switch"><Link to="/login">← Back to login</Link></p>
        </form>
      </div>
    </div>
  );
}
