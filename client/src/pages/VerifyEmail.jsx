import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getToken } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Loading, useTitle } from "../components/ui";

export default function VerifyEmail() {
  useTitle("Verify email");
  const { token } = useParams();
  const { refresh } = useAuth();
  const [state, setState] = useState({ status: "loading", message: "" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the link works once, so only call it once
    started.current = true;
    api("/auth/verify-email", { method: "POST", body: { token } })
      .then((d) => {
        setState({ status: "ok", message: d.message });
        if (getToken()) refresh().catch(() => {});
      })
      .catch((e) => setState({ status: "error", message: e.message }));
  }, [token, refresh]);

  return (
    <div className="container narrow">
      <div className="card center">
        {state.status === "loading" && <Loading text="Verifying your email…" />}
        {state.status === "ok" && <><div className="big-emoji" aria-hidden="true">✅</div><h1>Email verified</h1><p>{state.message}</p></>}
        {state.status === "error" && <><div className="big-emoji" aria-hidden="true">⚠️</div><h1>Link problem</h1><p>{state.message}</p><p className="muted">You can request a new link from your profile page.</p></>}
        <Link className="btn btn-dark" to="/dashboard">Continue</Link>
      </div>
    </div>
  );
}
