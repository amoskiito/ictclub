import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead, Loading, Alert, Empty, useFetch, useTitle } from "../components/ui";
import EventCard from "../components/EventCard";
import { isPast } from "../format";

const CATEGORIES = ["Workshop", "Hackathon", "Talk", "Social", "Bootcamp", "Other"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Calendar({ events, month, setMonth }) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // weeks start on Monday
  const days = new Date(y, m + 1, 0).getDate();
  const byDay = {};
  events.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() === y && d.getMonth() === m) (byDay[d.getDate()] ||= []).push(e);
  });
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const today = new Date();
  const isToday = (d) => d && today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  const shift = (n) => setMonth(new Date(y, m + n, 1));

  return (
    <div className="card calendar">
      <div className="calendar-head">
        <button className="btn btn-light btn-sm" onClick={() => shift(-1)} aria-label="Previous month">←</button>
        <h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
        <button className="btn btn-light btn-sm" onClick={() => shift(1)} aria-label="Next month">→</button>
      </div>
      <div className="calendar-grid" role="grid">
        {DAYS.map((d) => <div key={d} className="calendar-dow" role="columnheader">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={`calendar-cell${d ? "" : " empty-cell"}${isToday(d) ? " today" : ""}`} role="gridcell">
            {d && <span className="calendar-day">{d}</span>}
            {(byDay[d] || []).map((e) => (
              <Link key={e.id} to={`/events/${e.id}`} className="calendar-event" title={e.title}>
                {new Date(e.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} {e.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Events() {
  useTitle("Events");
  const { data, loading, error } = useFetch("/events");
  const [view, setView] = useState("list");
  const [when, setWhen] = useState("upcoming");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const all = data ? data.events : [];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = all.filter((e) => !category || e.category === category);
    if (term) list = list.filter((e) => `${e.title} ${e.description} ${e.location}`.toLowerCase().includes(term));
    return list;
  }, [all, category, q]);

  const listed = useMemo(() => {
    if (when === "upcoming") return filtered.filter((e) => !isPast(e));
    if (when === "past") return filtered.filter(isPast).reverse();
    return filtered;
  }, [filtered, when]);

  return (
    <div className="container">
      <PageHead title="Events" sub="Workshops, bootcamps, hackathons and more. Reserve your seat.">
        <div className="segmented" role="group" aria-label="View">
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>☰ List</button>
          <button className={view === "calendar" ? "on" : ""} onClick={() => setView("calendar")}>📅 Calendar</button>
        </div>
      </PageHead>

      <div className="toolbar">
        {view === "list" && (
          <div className="segmented" role="group" aria-label="When">
            {[["upcoming", "Upcoming"], ["past", "Past"], ["all", "All"]].map(([v, label]) => (
              <button key={v} className={when === v ? "on" : ""} onClick={() => setWhen(v)}>{label}</button>
            ))}
          </div>
        )}
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="input" type="search" placeholder="Search events…" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
      </div>

      {loading && !data ? <Loading /> : <Alert>{error}</Alert>}

      {data && view === "calendar" && <Calendar events={filtered} month={month} setMonth={setMonth} />}

      {data && view === "list" && (
        listed.length ? (
          <div className="grid-3">{listed.map((e) => <EventCard key={e.id} event={e} />)}</div>
        ) : (
          <Empty icon="🗓" title={when === "past" ? "No past events yet" : "No events found"}>
            {all.length ? "Try a different filter or search." : "Check back soon for the next event."}
          </Empty>
        )
      )}
    </div>
  );
}
