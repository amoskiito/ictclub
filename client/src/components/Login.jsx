import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Landscape from "./Landscape";
import { useAuth } from "../auth/AuthContext";
import { useTitle } from "./ui";
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from "./GlassIcons";
import "./auth.css";

const REMEMBER_KEY = "ictClubRememberEmail";

function Login() {
  useTitle("Login");
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill the email if "Remember me" was used before (the password is never stored).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) setEmail(saved);
    } catch { /* storage unavailable */ }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await login(email, password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch { /* ignore */ }
      // Go back to the page the visitor wanted, or to the dashboard.
      navigate((location.state && location.state.from) || "/dashboard", { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stage login-stage">
      <Landscape />

      <span className="orbit-chip oc1">🛡️ Cybersecurity</span>
      <span className="orbit-chip oc2">💻 Web Dev</span>
      <span className="orbit-chip oc3">🤖 AI Day</span>

      <form className="glass-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <p className="glass-lead">Welcome back, please login to your account.</p>

        <div className="glass-input">
          <span className="gi-icon"><UserIcon /></span>
          <input type="email" placeholder="Email" aria-label="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>

        <div className="glass-input">
          <span className="gi-icon"><LockIcon /></span>
          <input type={showPw ? "text" : "password"} placeholder="Password" aria-label="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          <button type="button" className="gi-eye" onClick={() => setShowPw(!showPw)}
            aria-label="Show or hide password">
            {showPw ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>

        <div className="login-row">
          <label className="remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className="tick" />
            Remember me
          </label>
          <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="glass-btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p className="glass-msg error">{message}</p>}

        <p className="glass-switch">
          Don't have an account? <Link to="/signup">Signup</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
