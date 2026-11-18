import { Link, useParams } from "react-router-dom";
import { Loading, useFetch, useTitle } from "../components/ui";
import { fmtDate } from "../format";

export default function NewsPost() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/content/news/${id}`);
  const post = data && data.item;
  useTitle(post ? post.title : "News");

  if (loading) return <div className="container"><Loading /></div>;
  if (error || !post) {
    return (
      <div className="container narrow">
        <div className="card center">
          <h1>Post not found</h1>
          <Link className="btn btn-dark" to="/news">Back to news</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="container narrow">
      <p className="crumbs"><Link to="/news">← All news</Link></p>
      <article className="card prose">
        <div className="badge-row">
          {post.category && <span className="badge badge-navy">{post.category}</span>}
          <span className="muted small">{fmtDate(post.createdAt)}{post.author ? ` · by ${post.author}` : ""}</span>
        </div>
        <h1>{post.title}</h1>
        {post.body.split(/\n\s*\n/).map((p, i) => <p key={i} className="pre-line">{p}</p>)}
      </article>
    </div>
  );
}
