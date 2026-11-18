import { Link } from "react-router-dom";
import { eventWhen, isPast, spotsLabel } from "../format";

export default function EventCard({ event }) {
  const past = isPast(event);
  const full = event.capacity && event.going >= event.capacity;
  return (
    <Link to={`/events/${event.id}`} className="event-card-link">
      <article className="event-tile">
        <div className="event-tile-cover" aria-hidden="true">{event.coverEmoji || "📅"}</div>
        <div className="event-tile-body">
          <div className="badge-row">
            <span className="badge badge-navy">{event.category}</span>
            {event.myStatus === "going" && <span className="badge badge-green">✓ You're going</span>}
            {event.myStatus === "waitlist" && <span className="badge badge-yellow">On waitlist</span>}
            {past && <span className="badge badge-gray">Past</span>}
          </div>
          <h3>{event.title}</h3>
          <p className="muted">🗓 {eventWhen(event)}</p>
          {event.location && <p className="muted">📍 {event.location}</p>}
          {!past && (
            <p className={full ? "spots spots-full" : "spots"}>{spotsLabel(event)}</p>
          )}
        </div>
      </article>
    </Link>
  );
}
