import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../auth/AuthContext";
import { site } from "../siteConfig";
import "./navbar.css";

const MORE = [
  ["/leadership", "Leadership"],
  ["/resources", "Resources"],
  ["/gallery", "Gallery"],
  ["/sponsors", "Sponsors"]
];

function Navbar() {
  const { user, logout, isOfficer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);   // mobile menu
  const [menu, setMenu] = useState(null);    // "more" | "user" | null
  const ref = useRef(null);

  // Close menus when the page changes or when clicking elsewhere.
  useEffect(() => { setOpen(false); setMenu(null); }, [location.pathname]);
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(null); };
    const onKey = (e) => { if (e.key === "Escape") setMenu(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  const toggle = (name) => setMenu((m) => (m === name ? null : name));
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <header className="navbar" ref={ref}>
      <Link to="/" className="navbar-brand">
        <Logo size={44} />
        <span>{site.name}</span>
      </Link>

      <button className="navbar-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "✕" : "☰"}
      </button>

      <nav className={open ? "navbar-links open" : "navbar-links"} aria-label="Main">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/news">News</NavLink>

        <div className="dropdown">
          <button className="nav-btn" aria-expanded={menu === "more"} onClick={() => toggle("more")}>
            Community ▾
          </button>
          {menu === "more" && (
            <div className="dropdown-menu">
              {MORE.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
              {user && <NavLink to="/directory">Member directory</NavLink>}
            </div>
          )}
        </div>

        <NavLink to="/contact">Contact</NavLink>

        {!user && <NavLink to="/signup">SignUp</NavLink>}
        {!user && <NavLink to="/login">Login</NavLink>}

        {user && (
          <div className="dropdown user-menu">
            <button className="nav-btn user-chip" aria-expanded={menu === "user"} onClick={() => toggle("user")}>
              <span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
              {user.name.split(" ")[0]} ▾
            </button>
            {menu === "user" && (
              <div className="dropdown-menu right">
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/my-events">My events</NavLink>
                <NavLink to="/profile">My profile</NavLink>
                {isOfficer && <NavLink to="/admin">Admin</NavLink>}
                <button onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
