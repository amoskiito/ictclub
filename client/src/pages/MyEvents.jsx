import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageHead, Loading, Alert, Empty, useFetch, useTitle } from "../components/ui";
import { eventWhen, isPast, hasStarted } from "../format";

export default function MyEvents() {
  useTitle("My events");
  const { data, loading, error, reload } = useFetch("/events/me/rsvps");
  const [msg, setMsg] = useState("");
  const events = data ? data.events : [];
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter(isPast);

  const leave = async (e) => {
    setMsg("");
    try {
      await api(`/events/${e.id}/rsvp`, { method: "DELETE" });
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const row = (e) => (
    <article className="card my-event" key={e.id}>
      <div className="my-event-cover" aria-hidden="true">{e.coverEmoji || "📅"}</div>
      <div className="my-event-body">
        <div className="badge-row">
          {e.myStatus === "going" && <span className="badge badge-green">✓ Going</span>}
          {e.myStatus === "waitlist" && <span className="badge badge-yellow">Waitlist</span>}
          {e.myAttended && <span className="badge badge-navy">Checked in</span>}
        </div>
        <h3><Link to={`/events/${e.id}`}>{e.title}</Link></h3>
        <p className="muted small">🗓 {eventWhen(e)}{e.location ? ` · 📍 ${e.location}` : ""}</p>
      </div>
      <div className="my-event-actions">
        {!isPast(e) && !e.myAttended && <button className="btn btn-light btn-sm" onClick={() => leave(e)}>Cancel</button>}
        {e.myAttended && hasStarted(e) && !e.feedbackGiven && <Link className="btn btn-yellow btn-sm" to={`/events/${e.id}`}>Leave feedback</Link>}
      </div>
    </article>
  );

  return (
    <div className="container narrow">
      <PageHead title="My events" sub="Your RSVPs and attendance.">
        <Link className="btn btn-dark" to="/events">Find events</Link>
      </PageHead>
      {loading && !data ? <Loading /> : <Alert>{error || msg}</Alert>}
      {data && !events.length && (
        <Empty icon="🎟️" title="No RSVPs yet">Browse upcoming events and reserve your first seat.</Empty>
      )}
      {upcoming.length > 0 && <><h2>Upcoming</h2><div className="stack">{upcoming.map(row)}</div></>}
      {past.length > 0 && <><h2>Past</h2><div className="stack">{past.map(row)}</div></>}
    </div>
  );
}
