import { useEffect, useState } from "react";
import { api } from "../api";

export function PageHead({ title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="page-head-actions">{children}</div>}
    </div>
  );
}

export function Loading({ text = "Loading..." }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  );
}

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  return <p className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</p>;
}

export function Empty({ icon = "📭", title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

// Loads data from the API: const { data, loading, error, reload } = useFetch("/events");
export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    api(path)
      .then((data) => alive && setState({ data, loading: false, error: "" }))
      .catch((err) => alive && setState({ data: null, loading: false, error: err.message }));
    return () => { alive = false; };
  }, [path, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ICT Club` : "ICT Club";
  }, [title]);
}
