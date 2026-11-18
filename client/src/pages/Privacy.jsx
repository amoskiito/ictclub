import { Link } from "react-router-dom";
import { PageHead, useTitle } from "../components/ui";
import { site } from "../siteConfig";

export default function Privacy() {
  useTitle("Privacy policy");
  return (
    <div className="container narrow">
      <PageHead title="Privacy policy" sub="How the club handles your personal data (Kenya Data Protection Act, 2019)." />
      <article className="card prose">
        <h2>1. Who we are</h2>
        <p>{site.name} at {site.university} is the data controller for the information collected on this website. Contact: <a href={`mailto:${site.email}`}>{site.email}</a>.</p>

        <h2>2. What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your name, email address, a securely hashed password and whether you are a student, lecturer, alumnus or guest.</li>
          <li><strong>Optional profile details:</strong> year of study, skills, a short bio and links you choose to add.</li>
          <li><strong>Event activity:</strong> which events you RSVP to, whether you checked in, and any feedback you leave.</li>
          <li><strong>Messages:</strong> what you send us through the contact form.</li>
        </ul>

        <h2>3. Why we use it</h2>
        <p>To run your membership, manage event places and attendance, send emails you need (verification, password reset, RSVP confirmations and event reminders), improve our events and reply to your messages. We do not sell your data.</p>

        <h2>4. Your consent</h2>
        <p>We collect your data with your consent, which you give when you tick the privacy box on sign-up or the contact form. You can withdraw it at any time by deleting your account.</p>

        <h2>5. Member directory</h2>
        <p>You are <strong>not</strong> listed in the member directory unless you switch it on in your profile. Only logged-in members can see it, and your email address is never shown there.</p>

        <h2>6. Who can see your data</h2>
        <p>Club officers and admins can see member details and event attendance so they can run the club. Admin actions are recorded in an audit log. We only share data with service providers needed to run the site (such as hosting and email delivery).</p>

        <h2>7. How long we keep it</h2>
        <p>We keep your data while your account is active. When you delete your account, your profile, RSVPs and feedback are removed. Contact messages are deleted when they are no longer needed.</p>

        <h2>8. Your rights</h2>
        <p>You may ask to access, correct, download or delete your data, and to object to or restrict how it is used. Most of this you can do yourself on your <Link to="/profile">profile page</Link>: edit your details, download a copy of your data or delete your account. For anything else, email us.</p>

        <h2>9. Security</h2>
        <p>Passwords are hashed, connections should use HTTPS, and access to admin tools is limited by role. No system is perfectly secure, so please choose a strong, unique password.</p>

        <h2>10. Complaints</h2>
        <p>If you are unhappy with how we handle your data you can contact us, or lodge a complaint with the Office of the Data Protection Commissioner of Kenya.</p>

        <p className="muted small">Last updated: November 2026.</p>
      </article>
    </div>
  );
}
