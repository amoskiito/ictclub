# University ICT Club Web Portal

React + Vite front end, Node/Express API, MongoDB database.

## Features
- **Public pages:** Home (live stats, upcoming events), About, Events (list, calendar, filters), News, Leadership, Resources, Gallery, Sponsors, Contact, Privacy
- **Accounts and roles:** sign up, log in, email verification, password reset, profile, opt-in member directory, data export, account deletion. Roles: member < officer < admin
- **Events:** RSVP with capacity and waitlist (auto-promotion), QR check-in, feedback, calendar links (.ics and Google), WhatsApp share, 24h reminder emails, "My events"
- **Admin dashboard:** analytics charts, event management and attendance, content management (news, resources, gallery, leaders, sponsors), contact inbox, members and roles, CSV exports, audit log
- **Original class dashboard:** registered students table with add and edit (now requires login)

## Requirements
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or an Atlas connection string

## First-time setup
```
cd server
npm install
copy .env.example .env      (Windows)     cp .env.example .env   (Mac/Linux)
```
Edit `server/.env`:
- `JWT_SECRET`: any long random string (required for real use)
- `ADMIN_EMAIL`: the email that becomes admin when it signs up
- `MONGO_URI`: only if not using local MongoDB

```
cd ../client
npm install
```

## Run (two terminals)
```
cd server && npm start        # API on http://localhost:3000
cd client && npm run dev      # site on http://localhost:5173
```

## Making someone an admin
Sign up first, then:
```
cd server
npm run make-admin -- person@example.com
```
Admins can also change roles in Admin dashboard > Members.

## Email
Without SMTP settings, emails (verification, reset, reminders) are printed in the server terminal. Set `SMTP_*` in `.env` to send real email.

## Tests
```
cd server && npm test
```
Runs API tests against an in-memory database (no MongoDB needed).

## Customise
Edit `client/src/siteConfig.js`: university name, founding year, contact email and phone, address, map location, social links. The privacy page is a template, so have your university review it.

## Never commit
`server/.env` (secrets). It is listed in `.gitignore`.

## Not built yet
Google sign-in, newsletter and bulk email, payments, mentorship, jobs, hackathon pages, learning tracks, badges and certificates, CAPTCHA, automated backups, CI/CD.
