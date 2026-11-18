import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useFetch, useTitle } from "../components/ui";
import EventCard from "../components/EventCard";
import { site } from "../siteConfig";

function CountUp({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

const BENEFITS = [
  ["🛠️", "Hands-on workshops", "Learn by building, from web apps to cybersecurity labs."],
  ["🏆", "Hackathons and projects", "Team up, ship something real and get feedback."],
  ["📚", "Resources hub", "Guides, links and past newsletters in one place."],
  ["🤝", "Networking", "Find members by skill in the member directory."],
  ["🎟️", "Easy RSVP and check-in", "Reserve a seat, join the waitlist, scan a QR code at the door."],
  ["🌍", "Open to every course", "You do not need to study computing to join."]
];

export default function Home() {
  useTitle("");
  const { user } = useAuth();
  const stats = useFetch("/public/stats");
  const events = useFetch("/events?when=upcoming");
  const upcoming = (events.data ? events.data.events : []).slice(0, 3);
  const s = stats.data;

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-text">
          <span className="pill">{site.university} · {site.name}</span>
          <h1>Where students <em>build</em>, <em>break</em> and <em>boost</em> tech.</h1>
          <p>
            Join the club, RSVP to workshops, bootcamps and hackathons, and meet students who love technology.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/events" className="btn btn-dark btn-lg">Browse events 🚀</Link>
            ) : (
              <Link to="/signup" className="btn btn-dark btn-lg">Join the club 🚀</Link>
            )}
            <Link to="/about" className="btn btn-light btn-lg">Learn more</Link>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="orb o1" />
          <div className="orb o2" />
          <div className="code-window">
            <div className="code-bar"><i /><i /><i /></div>
            <pre>{`const you = {
  role: "ICT Club member",
  events: 3,
  fun: true
};

register(you); // 🎉`}</pre>
          </div>
          <span className="chip c1">🛡️ Security</span>
          <span className="chip c2">💻 Web</span>
          <span className="chip c3">🤖 AI</span>
        </div>
      </section>

      <section className="stats" aria-label="Club statistics">
        {[
          ["Members", s && s.members],
          ["Upcoming events", s && s.upcomingEvents],
          ["Events held", s && s.eventsHeld],
          ["Seats booked", s && s.rsvps]
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <strong>{s ? <CountUp value={value} /> : "–"}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="block">
        <div className="block-head">
          <h2>Upcoming events</h2>
          <Link to="/events" className="link-strong">See all events →</Link>
        </div>
        {events.loading ? (
          <p className="muted">Loading events…</p>
        ) : upcoming.length ? (
          <div className="grid-3">{upcoming.map((e) => <EventCard key={e.id} event={e} />)}</div>
        ) : (
          <div className="card center"><p>No events are scheduled yet. Check back soon!</p></div>
        )}
      </section>

      <section className="block">
        <h2>Why join?</h2>
        <div className="grid-3">
          {BENEFITS.map(([icon, title, text]) => (
            <div className="card benefit" key={title}>
              <span className="benefit-icon" aria-hidden="true">{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>How it works</h2>
        <div className="steps">
          {[
            ["1", "Create an account", "Sign up with your email in seconds."],
            ["2", "Pick an event", "See what is on and reserve your seat."],
            ["3", "Show up and check in", "Scan the QR code at the venue. Done!"]
          ].map(([n, t, d]) => (
            <div className="step" key={n}>
              <div className="step-n">{n}</div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {!user && (
        <section className="cta">
          <h2>Ready to join {site.name}?</h2>
          <p>It is free and takes less than a minute.</p>
          <Link to="/signup" className="btn btn-yellow btn-lg">Create my account</Link>
        </section>
      )}
    </div>
  );
}
