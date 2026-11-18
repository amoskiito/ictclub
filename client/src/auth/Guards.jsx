import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth, RANK } from "./AuthContext";
import { Loading } from "../components/ui";

// Wrap a page in <RequireAuth> to make it members-only, or <RequireAuth role="officer"> for staff pages.
export function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (role && RANK[user.role] < RANK[role]) {
    return (
      <div className="container narrow">
        <div className="card center">
          <h1>🚫 Not allowed</h1>
          <p>You need to be {role === "admin" ? "an admin" : "an officer or admin"} to see this page.</p>
          <Link className="btn btn-dark" to="/">Back to home</Link>
        </div>
      </div>
    );
  }
  return children;
}
