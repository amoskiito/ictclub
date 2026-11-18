import { Loading, Alert, useFetch } from "../components/ui";
import { LineChart, BarChart, CHART_COLORS } from "../components/Charts";

export default function Overview() {
  const { data, loading, error } = useFetch("/admin/analytics");
  if (loading) return <Loading />;
  if (error) return <Alert>{error}</Alert>;
  const { totals, growth, perEvent } = data;
  const rated = perEvent.filter((e) => e.averageRating !== null);

  return (
    <div className="stack-lg">
      <div className="tiles">
        <div className="tile"><strong>{totals.members}</strong><span>Members</span></div>
        <div className="tile"><strong>{totals.officers + totals.admins}</strong><span>Officers and admins</span></div>
        <div className="tile"><strong>{totals.events}</strong><span>Events</span></div>
        <div className="tile"><strong>{totals.unreadMessages}</strong><span>Unread messages</span></div>
      </div>

      <div className="card">
        <h2>Member growth</h2>
        <p className="muted small">Total members at the end of each month (last 12 months).</p>
        <LineChart title="Total members by month" data={growth.map((g) => ({ label: g.month, value: g.total }))} />
      </div>

      <div className="card">
        <h2>Attendance</h2>
        <p className="muted small">Seats booked versus people who checked in (latest 10 past events).</p>
        {perEvent.length ? (
          <BarChart
            title="Attendance per event"
            series={[{ name: "Going", color: CHART_COLORS.navy }, { name: "Checked in", color: CHART_COLORS.teal }]}
            data={perEvent.map((e) => ({ label: e.title, values: [e.going, e.attended] }))}
          />
        ) : <p className="muted">Attendance will show here after your first event.</p>}
      </div>

      <div className="card">
        <h2>Event ratings</h2>
        <p className="muted small">Average feedback score out of 5.</p>
        {rated.length ? (
          <BarChart
            title="Average rating per event" max={5}
            series={[{ name: "Rating", color: CHART_COLORS.gold }]}
            data={rated.map((e) => ({ label: e.title, values: [e.averageRating] }))}
          />
        ) : <p className="muted">Ratings will show here once attendees leave feedback.</p>}
      </div>
    </div>
  );
}
