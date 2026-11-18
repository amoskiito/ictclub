import { Link } from "react-router-dom";
import { PageHead, useTitle } from "../components/ui";
import { site } from "../siteConfig";

const FAQ = [
  ["Do I need to study computing to join?", "No. The club is open to students from every course who are curious about technology."],
  ["Does it cost anything?", "Joining is free. Some special events may ask for a small contribution, which we always announce first."],
  ["How do I register for an event?", "Create an account, open the event page and press RSVP. If the event is full you can join the waitlist."],
  ["What is the QR code at events?", "Officers show a QR code at the venue. Scan it with your phone while logged in to check in."]
];

export default function About() {
  useTitle("About");
  const years = new Date().getFullYear() - site.founded;
  return (
    <div className="container">
      <PageHead title="About us" sub={`${site.name} at ${site.university}`} />

      <section className="card prose">
        <h2>Our mission</h2>
        <p>
          To help every student learn, build and share technology skills, and to create a friendly space where
          ideas turn into projects and projects turn into careers.
        </p>
      </section>

      <section className="block">
        <h2>Our story</h2>
        <ol className="timeline">
          <li><strong>{site.founded}</strong><span>The club is founded by a small group of students who wanted a place to build things together.</span></li>
          <li><strong>Growing</strong><span>Weekly workshops, study groups and our first hackathon bring in members from every faculty.</span></li>
          <li><strong>Today</strong><span>{years > 0 ? `${years} years on` : "Now"}, we run bootcamps, talks and projects, and this portal makes joining and attending easy.</span></li>
        </ol>
      </section>

      <section className="block">
        <h2>What members get</h2>
        <div className="grid-3">
          {[
            ["🛠️", "Practical skills", "Workshops and bootcamps taught by students and industry guests."],
            ["🤝", "A network", "Meet peers, alumni and partners through events and the member directory."],
            ["🚀", "Real projects", "Build for hackathons and show your work to the community."]
          ].map(([icon, title, text]) => (
            <div className="card benefit" key={title}>
              <span className="benefit-icon" aria-hidden="true">{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>Questions</h2>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>Come and build with us</h2>
        <Link to="/signup" className="btn btn-yellow btn-lg">Join the club</Link>
      </section>
    </div>
  );
}
