import { Link } from "react-router-dom";
import { PageHead, Loading, Alert, Empty, useFetch, useTitle } from "../components/ui";
import { initials } from "../format";

const TIERS = ["Gold", "Silver", "Bronze", "Partner"];

export default function Sponsors() {
  useTitle("Sponsors");
  const { data, loading, error } = useFetch("/content/sponsors");
  const items = data ? data.items : [];
  return (
    <div className="container">
      <PageHead title="Sponsors and partners" sub="Organisations that help our members learn and grow." />
      {loading ? <Loading /> : <Alert>{error}</Alert>}
      {data && !items.length && <Empty icon="🤝" title="Our partners will be listed here" />}
      {TIERS.map((tier) => {
        const group = items.filter((s) => s.tier === tier);
        if (!group.length) return null;
        return (
          <section key={tier} className="block">
            <h2>{tier === "Partner" ? "Partners" : `${tier} sponsors`}</h2>
            <div className="grid-3">
              {group.map((s) => {
                const inner = (
                  <article className={`card sponsor tier-${tier.toLowerCase()}`}>
                    {s.logoUrl
                      ? <img className="sponsor-logo" src={s.logoUrl} alt={`${s.name} logo`} loading="lazy" />
                      : <div className="sponsor-logo sponsor-initials" aria-hidden="true">{initials(s.name)}</div>}
                    <h3>{s.name}</h3>
                    {s.blurb && <p className="muted">{s.blurb}</p>}
                  </article>
                );
                return s.url
                  ? <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="event-card-link">{inner}</a>
                  : <div key={s.id}>{inner}</div>;
              })}
            </div>
          </section>
        );
      })}
      <section className="cta">
        <h2>Want to partner with us?</h2>
        <p>Sponsor an event, offer internships or give a talk.</p>
        <Link to="/contact" className="btn btn-yellow btn-lg">Get in touch</Link>
      </section>
    </div>
  );
}
