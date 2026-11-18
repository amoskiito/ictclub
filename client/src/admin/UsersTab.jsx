import { useEffect, useState } from "react";
import { api, download } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Alert, Loading, useFetch } from "../components/ui";
import { fmtDate } from "../format";

export default function UsersTab() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setApplied(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, reload } = useFetch(`/admin/users?q=${encodeURIComponent(applied)}`);
  const [msg, setMsg] = useState({ kind: "error", text: "" });

  const setRole = async (u, role) => {
    try {
      await api(`/admin/users/${u.id}/role`, { method: "PATCH", body: { role } });
      setMsg({ kind: "ok", text: `${u.name} is now ${role === "admin" ? "an admin" : role === "officer" ? "an officer" : "a member"}.` });
      reload();
    } catch (err) { setMsg({ kind: "error", text: err.message }); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name} (${u.email}) and their RSVPs and feedback?`)) return;
    try { await api(`/admin/users/${u.id}`, { method: "DELETE" }); reload(); }
    catch (err) { setMsg({ kind: "error", text: err.message }); }
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>Members</h2>
        <button className="btn btn-light btn-sm"
          onClick={() => download("/admin/export/members.csv", "members.csv").catch((e) => setMsg({ kind: "error", text: e.message }))}>
          ⬇ Export CSV
        </button>
      </div>
      <p className="muted small">Officers can manage events, news, resources, gallery and messages. Admins can also manage members, leadership, sponsors and the audit log.</p>
      <input className="input" type="search" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
      {loading && !data ? <Loading /> : <Alert>{error}</Alert>}
      <Alert kind={msg.kind}>{msg.text}</Alert>
      {data && (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong><br /><span className="muted small">{u.affiliation}{u.emailVerified ? " · ✓ verified" : ""}</span></td>
                  <td>{u.email}</td>
                  <td>
                    <select className="select select-sm" value={u.role} disabled={u.id === me.id}
                      onChange={(e) => setRole(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                      <option value="member">member</option>
                      <option value="officer">officer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td className="actions">
                    {u.id !== me.id && <button className="btn btn-danger-outline btn-sm" onClick={() => remove(u)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
