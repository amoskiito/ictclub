import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { api, API_BASE } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Loading, Alert, useFetch, useTitle } from "../components/ui";
import { eventWhen, isPast, hasStarted, googleCalendarUrl, spotsLabel } from "../format";

function Feedback({ event, existing, onSaved }) {
  const [rating, setRating] = useState(existing ? existing.rating : 0);
  const [comment, setComment] = useState(existing ? existing.comment : "");
  const [msg, setMsg] = useState({ kind: "", text: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ kind: "", text: "" });
    try {
      const d = await api(`/events/${event.id}/feedback`, { method: "POST", body: { rating, comment } });
      setMsg({ kind: "ok", text: d.message });
      onSaved();
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>How was it?</h2>
      <p className="muted">Your feedback helps us plan better events.</p>
      <div className="stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={n <= rating ? "star on" : "star"} onClick={() => setRating(n)}>★</button>
        ))}
      </div>
      <label className="field-label" htmlFor="fb-comment">Comment (optional)</label>
      <textarea id="fb-comment" className="textarea" rows="3" maxLength="1000" value={comment}
        onChange={(e) => setComment(e.target.value)} placeholder="What did you enjoy? What could be better?" />
      <button className="btn btn-dark" disabled={busy || !rating}>{existing ? "Update feedback" : "Send feedback"}</button>
      <Alert kind={msg.kind || "error"}>{msg.text}</Alert>
    </form>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user, isOfficer } = useAuth();
  const { data, loading, error, reload } = useFetch(`/events/${id}`);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const event = data && data.event;
  useTitle(event ? event.title : "Event");

  if (loading && !data) return <div className="container"><Loading /></div>;
  if (error || !event) {
    return (
      <div className="container narrow">
        <div className="card center">
          <h1>Event not found</h1>
          <p>{error || "This event does not exist or is no longer available."}</p>
          <Link className="btn btn-dark" to="/events">See all events</Link>
        </div>
      </div>
    );
  }

  const past = isPast(event);
  const started = hasStarted(event);
  const full = event.capacity > 0 && event.going >= event.capacity;
  const fillPct = event.capacity ? Math.min(100, Math.round((event.going / event.capacity) * 100)) : 0;
  const feedback = data.feedback;

  const act = async (method) => {
    setBusy(true);
    setMsg("");
    try {
      await api(`/events/${id}/rsvp`, { method });
      reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pageUrl = window.location.href;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${event.title} - ${pageUrl}`)}`;

  return (
    <div className="container">
      <p className="crumbs"><Link to="/events">← All events</Link></p>
      <div className="detail-grid">
        <div>
          <div className="card detail-main">
            <div className="detail-cover" aria-hidden="true">{event.coverEmoji || "📅"}</div>
            <div className="badge-row">
              <span className="badge badge-navy">{event.category}</span>
              {past && <span className="badge badge-gray">Past event</span>}
            </div>
            <h1>{event.title}</h1>
            <p className="muted">🗓 {eventWhen(event)}</p>
            {event.location && <p className="muted">📍 {event.location}</p>}
            <div className="prose">
              {(event.description || "More details coming soon.").split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
            </div>

            {(event.slidesUrl || event.recordingUrl) && (
              <div className="after-event">
                <h3>After the event</h3>
                {event.slidesUrl && <a className="btn btn-light" href={event.slidesUrl} target="_blank" rel="noopener noreferrer">📑 Slides</a>}
                {event.recordingUrl && <a className="btn btn-light" href={event.recordingUrl} target="_blank" rel="noopener noreferrer">🎥 Recording</a>}
              </div>
            )}
          </div>

          {user && event.myAttended && started && (
            <Feedback event={event} existing={feedback.mine} onSaved={reload} />
          )}
        </div>

        <aside className="card detail-side">
          <h2>Your seat</h2>
          {event.capacity > 0 && (
            <>
              <div className="meter" role="img" aria-label={`${event.going} of ${event.capacity} seats taken`}>
                <span style={{ width: `${fillPct}%` }} className={full ? "full" : ""} />
              </div>
              <p className="muted small">{event.going} of {event.capacity} seats taken
                {event.waitlist > 0 ? ` · ${event.waitlist} on waitlist` : ""}</p>
            </>
          )}
          <p className={full && !past ? "spots spots-full" : "spots"}>{past ? "This event has ended" : spotsLabel(event)}</p>

          {!past && !user && (
            <Link className="btn btn-dark btn-block" to="/login" state={{ from: location.pathname }}>Log in to RSVP</Link>
          )}

          {!past && user && !event.myStatus && (
            <button className="btn btn-dark btn-block" disabled={busy} onClick={() => act("POST")}>
              {full ? "Join the waitlist" : "RSVP – I'm going"}
            </button>
          )}

          {!past && user && event.myStatus === "going" && (
            <>
              <div className="status status-ok">✓ You're going</div>
              {event.myAttended ? (
                <p className="muted small">✅ You are checked in.</p>
              ) : (
                <p className="muted small">On the day, scan the QR code shown at the venue to check in.</p>
              )}
              {!event.myAttended && <button className="btn btn-light btn-block" disabled={busy} onClick={() => act("DELETE")}>Cancel my RSVP</button>}
            </>
          )}

          {!past && user && event.myStatus === "waitlist" && (
            <>
              <div className="status status-wait">⏳ You're on the waitlist</div>
              <p className="muted small">We will email you if a seat opens up.</p>
              <button className="btn btn-light btn-block" disabled={busy} onClick={() => act("DELETE")}>Leave the waitlist</button>
            </>
          )}

          {past && event.myAttended && <div className="status status-ok">✅ You attended</div>}
          <Alert>{msg}</Alert>

          <hr />
          <h3>Add to calendar</h3>
          <div className="stack">
            <a className="btn btn-light btn-block" href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">📆 Google Calendar</a>
            <a className="btn btn-light btn-block" href={`${API_BASE}/events/${event.id}/calendar.ics`}>⬇ Download .ics file</a>
            <a className="btn btn-light btn-block" href={whatsapp} target="_blank" rel="noopener noreferrer">💬 Share on WhatsApp</a>
          </div>

          {feedback.count > 0 && (
            <>
              <hr />
              <p className="muted small">⭐ {feedback.average} average from {feedback.count} rating{feedback.count > 1 ? "s" : ""}</p>
            </>
          )}

          {isOfficer && (
            <>
              <hr />
              <Link className="btn btn-yellow btn-block" to={`/admin?tab=events&event=${event.id}`}>Manage and check-in tools</Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
