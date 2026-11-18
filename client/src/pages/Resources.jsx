import { useState } from "react";
import { PageHead, Loading, Alert, Empty, useFetch, useTitle } from "../components/ui";

const KINDS = [
  ["", "All"], ["doc", "Documents"], ["link", "Links"], ["newsletter", "Newsletters"], ["form", "Forms"]
];
const ICONS = { doc: "📄", link: "🔗", newsletter: "📰", form: "📝" };

export default function Resources() {
  useTitle("Resources");
  const { data, loading, error } = useFetch("/content/resources");
  const [kind, setKind] = useState("");
  const items = (data ? data.items : []).filter((r) => !kind || r.kind === kind);
  return (
    <div className="container">
      <PageHead title="Resources hub" sub="Guides, documents, past newsletters and useful forms." />
      <div className="segmented wrap" role="group" aria-label="Type">
        {KINDS.map(([v, label]) => (
          <button key={v} className={kind === v ? "on" : ""} onClick={() => setKind(v)}>{label}</button>
        ))}
      </div>
      {loading ? <Loading /> : <Alert>{error}</Alert>}
      {data && !items.length && <Empty icon="📚" title="Nothing here yet">Resources will appear as officers add them.</Empty>}
      <div className="grid-2">
        {items.map((r) => (
          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="event-card-link">
            <article className="card resource">
              <span className="resource-icon" aria-hidden="true">{ICONS[r.kind] || "🔗"}</span>
              <div>
                <h3>{r.title}</h3>
                {r.description && <p className="muted">{r.description}</p>}
                <span className="link-strong">Open ↗</span>
              </div>
            </article>
          </a>
        ))}
      </div>
    </div>
  );
}
