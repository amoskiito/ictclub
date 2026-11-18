import { Link } from "react-router-dom";
import Logo from "./Logo";
import { site } from "../siteConfig";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><Logo size={40} /><span>{site.name}</span></div>
          <p>{site.tagline}</p>
          <div className="socials">
            {site.socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                {s.short}
              </a>
            ))}
          </div>
        </div>
        <nav aria-label="Explore">
          <h4>Explore</h4>
          <Link to="/about">About us</Link>
          <Link to="/events">Events</Link>
          <Link to="/news">News</Link>
          <Link to="/resources">Resources</Link>
        </nav>
        <nav aria-label="Community">
          <h4>Community</h4>
          <Link to="/leadership">Leadership</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/sponsors">Sponsors &amp; partners</Link>
          <Link to="/signup">Join the club</Link>
        </nav>
        <div>
          <h4>Contact</h4>
          <p>{site.email}</p>
          <p>{site.phone}</p>
          <Link to="/contact">Send us a message</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {site.name}, {site.university}</span>
        <Link to="/privacy">Privacy policy</Link>
      </div>
    </footer>
  );
}
