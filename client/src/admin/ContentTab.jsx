import { useState } from "react";
import { api } from "../api";
import { Alert, Loading, useFetch } from "../components/ui";
import { fmtDate } from "../format";
import { CONTENT, blankValues, toFormValues, fromFormValues } from "./contentConfig";

function Form({ type, config, item, onDone, onCancel }) {
  const [v, setV] = useState(item ? toFormValues(config, item) : blankValues(config));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = fromFormValues(config, v);
      if (item) await api(`/content/${type}/${item.id}`, { method: "PUT", body });
      else await api(`/content/${type}`, { method: "POST", body });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>{item ? `Edit ${config.singular}` : `New ${config.singular}`}</h2>
      <div className="form-grid">
        {config.fields.map((f) => {
          const id = `cf-${f.key}`;
          if (f.type === "checkbox") {
            return (
              <label key={f.key} className="consent-row light span-2">
                <input type="checkbox" checked={!!v[f.key]} onChange={set(f.key)} />
                <span>{f.label}</span>
              </label>
            );
          }
          return (
            <div key={f.key} className={f.span === 2 ? "span-2" : ""}>
              <label className="field-label" htmlFor={id}>{f.label}</label>
              {f.type === "textarea" || f.type === "images" ? (
                <textarea id={id} className="textarea" rows={f.rows || 5} required={f.required} value={v[f.key]} onChange={set(f.key)} />
              ) : f.type === "select" ? (
                <select id={id} className="select" value={v[f.key]} onChange={set(f.key)}>
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input id={id} className="input" type={f.type === "url" ? "url" : f.type === "number" ? "number" : "text"}
                  required={f.required} placeholder={f.placeholder} value={v[f.key]} onChange={set(f.key)} />
              )}
              {f.help && <p className="muted small">{f.help}</p>}
            </div>
          );
        })}
      </div>
      <Alert>{error}</Alert>
      <div className="row-actions">
        <button className="btn btn-dark" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function ContentTab({ type }) {
  const config = CONTENT[type];
  const { data, loading, error, reload } = useFetch(`/content/${type}/admin/all`);
  const [editing, setEditing] = useState(null); // null | "new" | item
  const [msg, setMsg] = useState("");

  const done = () => { setEditing(null); reload(); };
  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}"?`)) return;
    try { await api(`/content/${type}/${item.id}`, { method: "DELETE" }); reload(); } catch (err) { setMsg(err.message); }
  };

  if (editing) {
    return <Form type={type} config={config} item={editing === "new" ? null : editing} onDone={done} onCancel={() => setEditing(null)} />;
  }

  const cell = (col, item) => {
    const val = item[col.key];
    if (col.render) return col.render(val);
    if (col.date) return fmtDate(val);
    return val || "–";
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>{config.label}</h2>
        <button className="btn btn-dark btn-sm" onClick={() => setEditing("new")}>+ New {config.singular}</button>
      </div>
      {loading && !data ? <Loading /> : <Alert>{error || msg}</Alert>}
      {data && !data.items.length && <p className="muted">Nothing here yet. Add the first {config.singular}!</p>}
      {data && data.items.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead><tr>{config.columns.map((c) => <th key={c.key}>{c.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  {config.columns.map((c) => <td key={c.key} className="clip">{cell(c, item)}</td>)}
                  <td className="actions">
                    <button className="btn btn-light btn-sm" onClick={() => setEditing(item)}>Edit</button>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => remove(item)}>Delete</button>
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
