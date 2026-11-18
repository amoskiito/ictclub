import { Link } from "react-router-dom";
import { useTitle } from "../components/ui";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <div className="container narrow">
      <div className="card center notfound">
        <div className="big-404" aria-hidden="true">4<span>0</span>4</div>
        <h1>Oops, this page took a day off</h1>
        <p>The page you are looking for does not exist or has moved.</p>
        <div className="hero-actions center-actions">
          <Link to="/" className="btn btn-dark">Back to home</Link>
          <Link to="/events" className="btn btn-light">See events</Link>
        </div>
      </div>
    </div>
  );
}
