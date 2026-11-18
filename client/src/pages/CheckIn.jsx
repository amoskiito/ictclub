import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { Loading, useTitle } from "../components/ui";

// Opened by scanning the event QR code: /checkin/:eventId/:secret
export default function CheckIn() {
  useTitle("Check-in");
  const { id, secret } = useParams();
  const [state, setState] = useState({ status: "loading", message: "" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // React may run effects twice in development
    started.current = true;
    api(`/events/${id}/checkin`, { method: "POST", body: { secret } })
      .then((d) => setState({ status: "ok", message: d.message }))
      .catch((e) => setState({ status: "error", message: e.message }));
  }, [id, secret]);

  return (
    <div className="container narrow">
      <div className="card center">
        {state.status === "loading" && <Loading text="Checking you in…" />}
        {state.status === "ok" && (
          <>
            <div className="big-emoji" aria-hidden="true">✅</div>
            <h1>You're in!</h1>
            <p>{state.message}</p>
          </>
        )}
        {state.status === "error" && (
          <>
            <div className="big-emoji" aria-hidden="true">⚠️</div>
            <h1>Check-in did not work</h1>
            <p>{state.message}</p>
          </>
        )}
        <Link className="btn btn-dark" to={`/events/${id}`}>Go to the event page</Link>
      </div>
    </div>
  );
}
