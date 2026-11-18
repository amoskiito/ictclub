import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, download } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Alert, PageHead, useTitle } from "../components/ui";

const AFFILIATIONS = ["Student", "Lecturer", "Alumni", "Guest"];

export default function Profile() {
  useTitle("My profile");
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user.name,
    affiliation: user.affiliation,
    year: user.year,
    skills: user.skills.join(", "),
    bio: user.bio,
    github: user.links.github,
    linkedin: user.links.linkedin,
    website: user.links.website,
    directoryOptIn: user.directoryOptIn
  });
  const [msg, setMsg] = useState({ kind: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [dataMsg, setDataMsg] = useState({ kind: "", text: "" });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ kind: "", text: "" });
    try {
      const d = await api("/users/me", {
        method: "PUT",
        body: {
          name: form.name,
          affiliation: form.affiliation,
          year: form.year,
          skills: form.skills,
          bio: form.bio,
          directoryOptIn: form.directoryOptIn,
          links: { github: form.github, linkedin: form.linkedin, website: form.website }
        }
      });
      setUser(d.user);
      setMsg({ kind: "ok", text: "Profile saved." });
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      const d = await api("/auth/resend-verification", { method: "POST" });
      setVerifyMsg(d.message);
    } catch (err) {
      setVerifyMsg(err.message);
    }
  };

  const exportData = async () => {
    try {
      await download("/users/me/export", "my-ict-club-data.json");
      setDataMsg({ kind: "ok", text: "Your data has been downloaded." });
    } catch (err) {
      setDataMsg({ kind: "error", text: err.message });
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    setDataMsg({ kind: "", text: "" });
    try {
      await api("/users/me", { method: "DELETE", body: { password } });
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      setDataMsg({ kind: "error", text: err.message });
    }
  };

  return (
    <div className="container narrow">
      <PageHead title="My profile" sub={user.email}>
        <span className="badge badge-navy">{user.role}</span>
      </PageHead>

      {!user.emailVerified && (
        <div className="alert alert-info">
          <strong>Please verify your email.</strong> We sent a link to {user.email}.{" "}
          <button className="link-btn" onClick={resend}>Resend the email</button>
          {verifyMsg && <span> · {verifyMsg}</span>}
        </div>
      )}

      <form className="card" onSubmit={save}>
        <h2>About you</h2>
        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="p-name">Full name</label>
            <input id="p-name" className="input" required minLength={2} maxLength={80} value={form.name} onChange={set("name")} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-aff">I am a…</label>
            <select id="p-aff" className="select" value={form.affiliation} onChange={set("affiliation")}>
              {AFFILIATIONS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="p-year">Year of study</label>
            <input id="p-year" className="input" maxLength={20} placeholder="e.g. Year 2" value={form.year} onChange={set("year")} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-skills">Skills (separate with commas)</label>
            <input id="p-skills" className="input" placeholder="React, Python, Networking" value={form.skills} onChange={set("skills")} />
          </div>
        </div>

        <label className="field-label" htmlFor="p-bio">Short bio</label>
        <textarea id="p-bio" className="textarea" rows="3" maxLength={500} value={form.bio} onChange={set("bio")} />

        <div className="form-grid three">
          <div>
            <label className="field-label" htmlFor="p-gh">GitHub link</label>
            <input id="p-gh" type="url" className="input" placeholder="https://github.com/you" value={form.github} onChange={set("github")} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-li">LinkedIn link</label>
            <input id="p-li" type="url" className="input" placeholder="https://linkedin.com/in/you" value={form.linkedin} onChange={set("linkedin")} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-web">Website</label>
            <input id="p-web" type="url" className="input" placeholder="https://" value={form.website} onChange={set("website")} />
          </div>
        </div>

        <label className="consent-row light">
          <input type="checkbox" checked={form.directoryOptIn} onChange={set("directoryOptIn")} />
          <span>
            <strong>Show me in the member directory.</strong> Other logged-in members will see my name, skills, bio and
            links (never my email). You can turn this off any time.
          </span>
        </label>

        <Alert kind={msg.kind || "error"}>{msg.text}</Alert>
        <button className="btn btn-dark" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
      </form>

      <section className="card">
        <h2>Your data and privacy</h2>
        <p className="muted">
          You are in control of your information. Read our <Link to="/privacy">privacy policy</Link>.
        </p>
        <div className="hero-actions">
          <button className="btn btn-light" onClick={exportData}>⬇ Download my data</button>
          <button className="btn btn-danger-outline" onClick={() => setShowDelete(!showDelete)}>🗑 Delete my account</button>
        </div>
        {showDelete && (
          <form className="danger-box" onSubmit={deleteAccount}>
            <p><strong>This permanently deletes your account, RSVPs and feedback.</strong> It cannot be undone.</p>
            <label className="field-label" htmlFor="p-del">Type your password to confirm</label>
            <input id="p-del" type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <button className="btn btn-danger">Yes, delete everything</button>
          </form>
        )}
        <Alert kind={dataMsg.kind || "error"}>{dataMsg.text}</Alert>
      </section>
    </div>
  );
}
