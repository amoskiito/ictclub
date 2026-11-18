import { useState } from "react";
import { api } from "../api";
import { Alert, Loading, useFetch } from "../components/ui";
import { fmtDateTime } from "../format";

export default function MessagesTab() {
  const { data, loading, error, reload } = useFetch("/admin/messages");
  const [msg, setMsg] = useState("");

  const mark = async (m) => {
    try { await api(`/admin/messages/${m.id}`, { method: "PATCH", body: { handled: !m.handled } }); reload(); }
    catch (err) { setMsg(err.message); }
  };
  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    try { await api(`/admin/messages/${m.id}`, { method: "DELETE" }); reload(); }
    catch (err) { setMsg(err.message); }
  };

  return (
    <div className="card">
      <h2>Contact messages</h2>
      {loading && !data ? <Loading /> : <Alert>{error || msg}</Alert>}
      {data && !data.items.length && <p className="muted">No messages yet.</p>}
      <div className="stack">
        {data && data.items.map((m) => (
          <article key={m.id} className={`message${m.handled ? " handled" : ""}`}>
            <div className="card-head">
              <div>
                <strong>{m.name}</strong> <span className="muted small">&lt;{m.email}&gt; · {fmtDateTime(m.createdAt)}</span>
              </div>
              <span className={`badge ${m.handled ? "badge-gray" : "badge-yellow"}`}>{m.handled ? "Done" : "New"}</span>
            </div>
            <p className="pre-line">{m.message}</p>
            <div className="row-actions">
              <a className="btn btn-dark btn-sm" href={`mailto:${m.email}?subject=Re: your message to the ICT Club`}>Reply by email</a>
              <button className="btn btn-light btn-sm" onClick={() => mark(m)}>{m.handled ? "Mark as new" : "Mark as done"}</button>
              <button className="btn btn-danger-outline btn-sm" onClick={() => remove(m)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
