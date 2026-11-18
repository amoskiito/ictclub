import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PageHead, useTitle } from "../components/ui";
import Overview from "./Overview";
import EventsTab from "./EventsTab";
import ContentTab from "./ContentTab";
import MessagesTab from "./MessagesTab";
import UsersTab from "./UsersTab";
import AuditTab from "./AuditTab";
import "./admin.css";

const TABS = [
  { id: "overview", label: "📊 Overview" },
  { id: "events", label: "🗓 Events" },
  { id: "news", label: "📰 News" },
  { id: "resources", label: "📚 Resources" },
  { id: "albums", label: "📷 Gallery" },
  { id: "messages", label: "✉️ Messages" },
  { id: "leaders", label: "👥 Leadership", admin: true },
  { id: "sponsors", label: "🤝 Sponsors", admin: true },
  { id: "users", label: "🧑‍🎓 Members", admin: true },
  { id: "audit", label: "🧾 Audit log", admin: true }
];

export default function Admin() {
  useTitle("Admin");
  const { isAdmin, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter((t) => !t.admin || isAdmin);
  const tab = tabs.some((t) => t.id === params.get("tab")) ? params.get("tab") : "overview";

  const panel = {
    overview: <Overview />,
    events: <EventsTab />,
    messages: <MessagesTab />,
    users: <UsersTab />,
    audit: <AuditTab />
  }[tab] || <ContentTab key={tab} type={tab} />;

  return (
    <div className="container wide">
      <PageHead title="Admin dashboard" sub={`Signed in as ${user.name} (${user.role})`} />
      <div className="admin-layout">
        <nav className="admin-nav" aria-label="Admin sections">
          {tabs.map((t) => (
            <button key={t.id} className={t.id === tab ? "on" : ""} onClick={() => setParams({ tab: t.id })}>
              {t.label}
            </button>
          ))}
        </nav>
        <section className="admin-panel">{panel}</section>
      </div>
    </div>
  );
}
