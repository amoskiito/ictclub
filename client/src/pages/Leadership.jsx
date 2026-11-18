import { PageHead, Loading, Alert, Empty, useFetch, useTitle } from "../components/ui";
import { initials } from "../format";

export default function Leadership() {
  useTitle("Leadership");
  const { data, loading, error } = useFetch("/content/leaders");
  const items = data ? data.items : [];
  return (
    <div className="container">
      <PageHead title="Our leadership" sub="Meet the students who run the club." />
      {loading ? <Loading /> : <Alert>{error}</Alert>}
      {data && !items.length && <Empty icon="👥" title="Leaders coming soon">Profiles will appear here once the committee is added.</Empty>}
      <div className="grid-3">
        {items.map((l) => (
          <article className="card leader" key={l.id}>
            {l.photoUrl
              ? <img className="leader-photo" src={l.photoUrl} alt={`${l.name}`} loading="lazy" />
              : <div className="leader-photo leader-initials" aria-hidden="true">{initials(l.name)}</div>}
            <h3>{l.name}</h3>
            <p className="leader-role">{l.position}</p>
            {l.bio && <p className="muted">{l.bio}</p>}
            <div className="leader-links">
              {l.linkedin && <a href={l.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {l.github && <a href={l.github} target="_blank" rel="noopener noreferrer">GitHub</a>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
