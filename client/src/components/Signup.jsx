import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "./Logo";
import { api } from "../api";
import { useTitle } from "./ui";
import { UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "./GlassIcons";
import "./auth.css";

const COLORS = ["#7ddc5a", "#ffc21a", "#1fb6a6", "#ff5d5d", "#ffffff"];
const ROLES = ["Student", "Lecturer", "Alumni", "Guest"];
const LABELS = ["", "Weak", "Okay", "Good", "Strong 💪"];

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return pw ? Math.max(1, score) : 0;
}

function Signup() {
  useTitle("Join the club");
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = strengthOf(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/signup", {
        method: "POST",
        body: { name, email, password, affiliation: role, consent }
      });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stage signup-stage">
      <span className="glow g1" />
      <span className="glow g2" />

      <div className="signup-wrap">
        <div className="signup-logo"><Logo size={64} /></div>

        <form className="dark-card" onSubmit={handleSubmit}>
          {success && (
            <div className="confetti">
              {Array.from({ length: 44 }).map((_, n) => (
                <i key={n} style={{
                  left: `${(n * 97) % 100}%`,
                  background: COLORS[n % COLORS.length],
                  animationDelay: `${(n % 10) * 0.08}s`
                }} />
              ))}
            </div>
          )}

          <div className="badge-row">
            <span className="badge"><i /> ICT CLUB MEMBERSHIP</span>
          </div>
          <h2>Join the ICT Club</h2>
          <p className="dark-lead">Be among the first to register for the next event.</p>

          <div className="inner-panel">
            <label className="dl" htmlFor="name">Full Name</label>
            <div className="dark-input">
              <span className="gi-icon"><UserIcon /></span>
              <input id="name" type="text" placeholder="Enter your full name"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <label className="dl" htmlFor="email">Email Address</label>
            <div className="dark-input">
              <span className="gi-icon"><MailIcon /></span>
              <input id="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <span className="dl">I am a...</span>
            <div className="role-row">
              {ROLES.map((r) => (
                <button type="button" key={r}
                  className={role === r ? "role active" : "role"}
                  onClick={() => setRole(r)}>
                  {r}
                </button>
              ))}
            </div>

            <div className="two-col">
              <div>
                <label className="dl" htmlFor="password">Password</label>
                <div className="dark-input">
                  <span className="gi-icon"><LockIcon /></span>
                  <input id="password" type={showPw ? "text" : "password"} placeholder="Create password"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="gi-eye" onClick={() => setShowPw(!showPw)}
                    aria-label="Show or hide password">
                    {showPw ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>
              <div>
                <label className="dl" htmlFor="confirm">Confirm</label>
                <div className="dark-input">
                  <span className="gi-icon"><LockIcon /></span>
                  <input id="confirm" type={showPw ? "text" : "password"} placeholder="Repeat password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
              </div>
            </div>

            <p className="hint">At least 8 characters, with a letter and a number.</p>
            {password && (
              <>
                <div className={`strength s${strength}`}><span /><span /><span /><span /></div>
                <div className="strength-label">{LABELS[strength]}</div>
              </>
            )}

            <label className="consent-row">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
              <span>I agree to the <Link to="/privacy" target="_blank">privacy policy</Link> and to the club storing my details.</span>
            </label>

            <button className="join-btn" type="submit" disabled={loading || success}>
              {loading ? "Creating account..." : success ? "Welcome aboard! 🎊" : "Join the Club →"}
            </button>

            {message && <p className="glass-msg error">{message}</p>}
            {success && <p className="glass-msg ok">Account created! Taking you to login...</p>}

            <p className="privacy">We respect your privacy. No spam, ever.</p>
          </div>

          <p className="dark-switch">
            Already a member? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
