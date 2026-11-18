import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { LockIcon } from "../components/GlassIcons";
import { useTitle } from "../components/ui";
import "../components/auth.css";

export default function ResetPassword() {
  useTitle("Choose a new password");
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match");
    setBusy(true);
    try {
      await api("/auth/reset", { method: "POST", body: { token, password } });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
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
          <h2>Choose a new password</h2>
          <p className="dark-lead">At least 8 characters, with a letter and a number.</p>
          {done ? (
            <p className="glass-msg ok">Password updated! Taking you to login…</p>
          ) : (
            <div className="inner-panel">
              <label className="dl" htmlFor="rp-pw">New password</label>
              <div className="dark-input">
                <span className="gi-icon"><LockIcon /></span>
                <input id="rp-pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <label className="dl" htmlFor="rp-confirm">Confirm new password</label>
              <div className="dark-input">
                <span className="gi-icon"><LockIcon /></span>
                <input id="rp-confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              </div>
              <button className="join-btn" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
              {error && <p className="glass-msg error">{error}</p>}
            </div>
          )}
          <p className="dark-switch"><Link to="/login">← Back to login</Link></p>
        </form>
      </div>
    </div>
  );
}
