import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead, Loading, Alert, Empty, useFetch, useTitle } from "../components/ui";
import { initials } from "../format";

export default function Directory() {
  useTitle("Member directory");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setApplied(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error } = useFetch(`/users/directory?q=${encodeURIComponent(applied)}`);
  const members = data ? data.members : [];

  return (
    <div className="container">
      <PageHead title="Member directory" sub="Members who chose to be listed. Search by name or skill.">
        <Link className="btn btn-light" to="/profile">Edit my listing</Link>
      </PageHead>
      <div className="toolbar">
        <input className="input" type="search" placeholder="Search by name or skill, e.g. React" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
      </div>
      {loading && !data ? <Loading /> : <Alert>{error}</Alert>}
      {data && !members.length && (
        <Empty icon="🔍" title={applied ? "No members match your search" : "Nobody is listed yet"}>
          Members appear here once they switch on the directory in their profile.
        </Empty>
      )}
      <div className="grid-3">
        {members.map((m) => (
          <article className="card member" key={m.id}>
            <div className="member-head">
              <div className="leader-photo leader-initials small" aria-hidden="true">{initials(m.name)}</div>
              <div>
                <h3>{m.name}</h3>
                <p className="muted small">{m.affiliation}{m.year ? ` · ${m.year}` : ""}</p>
              </div>
            </div>
            {m.bio && <p>{m.bio}</p>}
            {m.skills.length > 0 && (
              <div className="chips">{m.skills.map((s) => <span key={s} className="chip-tag">{s}</span>)}</div>
            )}
            <div className="leader-links">
              {m.links.github && <a href={m.links.github} target="_blank" rel="noopener noreferrer">GitHub</a>}
              {m.links.linkedin && <a href={m.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {m.links.website && <a href={m.links.website} target="_blank" rel="noopener noreferrer">Website</a>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
