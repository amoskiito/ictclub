import { Alert, Loading, useFetch } from "../components/ui";
import { fmtDateTime } from "../format";

const describe = (l) => {
  const d = l.details || {};
  return d.title || d.email || (d.to ? `${d.from} → ${d.to}` : "") || (d.count !== undefined ? `${d.count} rows` : "") || l.targetId || "";
};

export default function AuditTab() {
  const { data, loading, error } = useFetch("/admin/audit");
  return (
    <div className="card">
      <h2>Audit log</h2>
      <p className="muted small">The latest 300 actions taken by officers and admins.</p>
      {loading ? <Loading /> : <Alert>{error}</Alert>}
      {data && !data.logs.length && <p className="muted">No actions recorded yet.</p>}
      {data && data.logs.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {data.logs.map((l) => (
                <tr key={l.id}>
                  <td>{fmtDateTime(l.createdAt)}</td>
                  <td>{l.actor}<br /><span className="muted small">{l.email}</span></td>
                  <td><code>{l.action}</code></td>
                  <td className="clip">{describe(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
