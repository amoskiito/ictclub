import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, download } from "../api";
import { Alert, Loading, useFetch } from "../components/ui";
import QrImage from "../components/QrImage";
import { fmtDateTime, fromInputValue, toInputValue } from "../format";

const CATEGORIES = ["Workshop", "Hackathon", "Talk", "Social", "Bootcamp", "Other"];
const EMPTY = {
  title: "", category: "Workshop", date: "", endDate: "", location: "", capacity: 0,
  description: "", coverEmoji: "📅", slidesUrl: "", recordingUrl: "", published: true
};

function EventForm({ initial, onDone, onCancel }) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const body = { ...f, capacity: Number(f.capacity) || 0, date: fromInputValue(f.date), endDate: fromInputValue(f.endDate) };
    try {
      if (f.id) await api(`/events/${f.id}`, { method: "PUT", body });
      else await api("/events", { method: "POST", body });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>{f.id ? "Edit event" : "New event"}</h2>
      <div className="form-grid">
        <div className="span-2">
          <label className="field-label" htmlFor="ev-title">Title</label>
          <input id="ev-title" className="input" required maxLength={120} value={f.title} onChange={set("title")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-cat">Category</label>
          <select id="ev-cat" className="select" value={f.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="ev-emoji">Icon (emoji)</label>
          <input id="ev-emoji" className="input" maxLength={8} value={f.coverEmoji} onChange={set("coverEmoji")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-date">Starts</label>
          <input id="ev-date" type="datetime-local" className="input" required value={f.date} onChange={set("date")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-end">Ends (optional)</label>
          <input id="ev-end" type="datetime-local" className="input" value={f.endDate} onChange={set("endDate")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-loc">Location</label>
          <input id="ev-loc" className="input" maxLength={200} value={f.location} onChange={set("location")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-cap">Capacity (0 = unlimited)</label>
          <input id="ev-cap" type="number" min="0" max="5000" className="input" value={f.capacity} onChange={set("capacity")} />
        </div>
        <div className="span-2">
          <label className="field-label" htmlFor="ev-desc">Description</label>
          <textarea id="ev-desc" className="textarea" rows="5" maxLength={4000} value={f.description} onChange={set("description")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-slides">Slides link (after the event)</label>
          <input id="ev-slides" type="url" className="input" placeholder="https://" value={f.slidesUrl} onChange={set("slidesUrl")} />
        </div>
        <div>
          <label className="field-label" htmlFor="ev-rec">Recording link</label>
          <input id="ev-rec" type="url" className="input" placeholder="https://" value={f.recordingUrl} onChange={set("recordingUrl")} />
        </div>
      </div>
      <label className="consent-row light">
        <input type="checkbox" checked={f.published} onChange={set("published")} />
        <span>Published (visible to everyone). Untick to keep it as a draft.</span>
      </label>
      <Alert>{error}</Alert>
      <div className="row-actions">
        <button className="btn btn-dark" disabled={busy}>{busy ? "Saving…" : "Save event"}</button>
        <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Manage({ eventId, onClose }) {
  const { data, loading, error, reload } = useFetch(`/events/${eventId}/admin`);
  const [msg, setMsg] = useState("");
  const [secret, setSecret] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState(null);

  useEffect(() => { if (data) { setSecret(data.checkinSecret); setRows(data.attendees); } }, [data]);
  if (loading && !data) return <Loading />;
  if (error) return <Alert>{error}</Alert>;
  if (!rows) return null;

  const link = `${window.location.origin}/checkin/${eventId}/${secret}`;
  const toggle = async (a) => {
    setMsg("");
    try {
      await api(`/events/${eventId}/attendance`, { method: "PATCH", body: { userId: a.userId, attended: !a.attended } });
      setRows(rows.map((r) => (r.userId === a.userId ? { ...r, attended: !a.attended } : r)));
    } catch (err) { setMsg(err.message); }
  };
  const rotate = async () => {
    if (!window.confirm("Make a new QR code? The old one will stop working.")) return;
    try { setSecret((await api(`/events/${eventId}/rotate-secret`, { method: "POST" })).checkinSecret); }
    catch (err) { setMsg(err.message); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { setMsg("Could not copy. Select the link and copy it manually."); }
  };
  const going = rows.filter((r) => r.status === "going");
  const wait = rows.filter((r) => r.status === "waitlist");

  return (
    <div className="card">
      <div className="card-head">
        <h2>{data.event.title}</h2>
        <button className="btn btn-light btn-sm" onClick={onClose}>Close</button>
      </div>

      <div className="checkin-box">
        <QrImage text={link} size={200} label={`Check-in QR code for ${data.event.title}`} />
        <div>
          <h3>Check-in QR code</h3>
          <p className="muted small">Show this on a screen at the venue. Members scan it with their phone camera while logged in.
            Check-in opens 3 hours before the start.</p>
          <p className="code-line">{link}</p>
          <div className="row-actions">
            <button className="btn btn-light btn-sm" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
            <button className="btn btn-light btn-sm" onClick={rotate}>New code</button>
          </div>
        </div>
      </div>

      <div className="card-head">
        <h3>Attendees ({going.length} going{wait.length ? `, ${wait.length} waitlist` : ""}, {going.filter((r) => r.attended).length} checked in)</h3>
        <button className="btn btn-light btn-sm" onClick={() => download(`/events/${eventId}/attendees.csv`, "attendees.csv").catch((e) => setMsg(e.message))}>
          ⬇ Export CSV
        </button>
      </div>
      <Alert>{msg}</Alert>
      {rows.length ? (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>RSVP date</th><th>Checked in</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.userId}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td><span className={`badge ${a.status === "going" ? "badge-green" : "badge-yellow"}`}>{a.status}</span></td>
                  <td>{fmtDateTime(a.rsvpAt)}</td>
                  <td>
                    {a.status === "going"
                      ? <label className="switch"><input type="checkbox" checked={a.attended} onChange={() => toggle(a)} aria-label={`Checked in: ${a.name}`} /><span /></label>
                      : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted">Nobody has RSVPed yet.</p>}

      {data.feedback.length > 0 && (
        <>
          <h3>Feedback ({data.feedback.length})</h3>
          <ul className="feedback-list">
            {data.feedback.map((f, i) => (
              <li key={i}><span className="stars-static" aria-label={`${f.rating} out of 5`}>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span> {f.comment || <em className="muted">No comment</em>}</li>
            ))}
          </ul>
        </>
      )}
      <button className="link-btn" onClick={reload}>↻ Refresh</button>
    </div>
  );
}

export default function EventsTab() {
  const { data, loading, error, reload } = useFetch("/events/admin/list");
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const managing = params.get("event");

  const manage = (id) => setParams(id ? { tab: "events", event: id } : { tab: "events" });
  const done = () => { setEditing(null); reload(); };
  const remove = async (ev) => {
    if (!window.confirm(`Delete "${ev.title}" and all its RSVPs and feedback?`)) return;
    try { await api(`/events/${ev.id}`, { method: "DELETE" }); reload(); } catch (err) { setMsg(err.message); }
  };

  if (editing) return <EventForm initial={editing} onDone={done} onCancel={() => setEditing(null)} />;
  if (managing) return <Manage key={managing} eventId={managing} onClose={() => manage(null)} />;

  return (
    <div className="card">
      <div className="card-head">
        <h2>Events</h2>
        <button className="btn btn-dark btn-sm" onClick={() => setEditing({ ...EMPTY })}>+ New event</button>
      </div>
      {loading && !data ? <Loading /> : <Alert>{error || msg}</Alert>}
      {data && !data.events.length && <p className="muted">No events yet. Create the first one!</p>}
      {data && data.events.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Event</th><th>Starts</th><th>Seats</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data.events.map((ev) => (
                <tr key={ev.id}>
                  <td><strong>{ev.coverEmoji} {ev.title}</strong><br /><span className="muted small">{ev.category}</span></td>
                  <td>{fmtDateTime(ev.date)}</td>
                  <td>{ev.going}{ev.capacity ? ` / ${ev.capacity}` : ""}{ev.waitlist ? ` (+${ev.waitlist} waiting)` : ""}</td>
                  <td><span className={`badge ${ev.published ? "badge-green" : "badge-gray"}`}>{ev.published ? "Published" : "Draft"}</span></td>
                  <td className="actions">
                    <button className="btn btn-yellow btn-sm" onClick={() => manage(ev.id)}>Check-in</button>
                    <button className="btn btn-light btn-sm" onClick={() => setEditing({
                      ...ev, date: toInputValue(ev.date), endDate: toInputValue(ev.endDate)
                    })}>Edit</button>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => remove(ev)}>Delete</button>
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
