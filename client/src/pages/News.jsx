import { Link } from "react-router-dom";
import { PageHead, Loading, Alert, Empty, useFetch, useTitle } from "../components/ui";
import { fmtDate } from "../format";

export default function News() {
  useTitle("News");
  const { data, loading, error } = useFetch("/content/news");
  const items = data ? data.items : [];
  return (
    <div className="container">
      <PageHead title="News and blog" sub="Updates, announcements and stories from the club." />
      {loading ? <Loading /> : <Alert>{error}</Alert>}
      {data && !items.length && <Empty icon="📰" title="No posts yet">Check back soon for club news.</Empty>}
      <div className="grid-2">
        {items.map((p) => (
          <Link key={p.id} to={`/news/${p.id}`} className="event-card-link">
            <article className="card post-card">
              <div className="badge-row">
                {p.category && <span className="badge badge-navy">{p.category}</span>}
                <span className="muted small">{fmtDate(p.createdAt)}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.excerpt || p.body.slice(0, 160) + (p.body.length > 160 ? "…" : "")}</p>
              <span className="link-strong">Read more →</span>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
