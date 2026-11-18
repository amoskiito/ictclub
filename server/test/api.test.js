// Run with:  npm test      (no MongoDB needed, it uses an in-memory database)
process.env.NODE_ENV = "test";
process.env.ADMIN_EMAIL = "ann@x.com";
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { FakeDb } = require("./fakeDb");
const { createApp } = require("../app");
const { ensureSetup } = require("../lib/setup");
const { runReminders } = require("../lib/reminders");
const { outbox } = require("../lib/mailer");

let server, base, db;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const type = res.headers.get("content-type") || "";
  const data = type.includes("json") ? await res.json() : await res.text();
  return { status: res.status, data, headers: res.headers };
}

async function signup(name, email, extra = {}) {
  const r = await call("POST", "/auth/signup", {
    body: { name, email, password: "Passw0rd!x", consent: true, ...extra }
  });
  return r;
}
async function login(email, password = "Passw0rd!x") {
  const r = await call("POST", "/auth/login", { body: { email, password } });
  return r.data;
}

const hours = (n) => new Date(Date.now() + n * 3600 * 1000).toISOString();

before(async () => {
  db = new FakeDb();
  // An old-style user from the previous version of the app (role held "Student").
  await db.collection("users").insertOne({ name: "Old Timer", email: "old@x.com", password: "x", role: "Student", createdAt: new Date() });
  await ensureSetup(db);
  server = createApp(db).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test("old users are upgraded to the new role system", async () => {
  const u = await db.collection("users").findOne({ email: "old@x.com" });
  assert.equal(u.role, "member");
  assert.equal(u.affiliation, "Student");
});

test("signup validation and consent", async () => {
  assert.equal((await signup("A", "a@x.com")).status, 400); // name too short
  assert.equal((await signup("Ann Admin", "not-an-email")).status, 400);
  assert.equal((await signup("Ann Admin", "ann@x.com", { password: "short" })).status, 400);
  assert.equal((await signup("Ann Admin", "ann@x.com", { consent: false })).status, 400);
});

let admin, adminTok, memberTok, member2Tok, officerTok;

test("signup, login, roles and /me", async () => {
  assert.equal((await signup("Ann Admin", "ann@x.com")).status, 201);
  assert.equal((await signup("Ann Admin", "ann@x.com")).status, 409);
  assert.equal((await signup("Bob Member", "bob@x.com", { affiliation: "Alumni" })).status, 201);
  assert.equal((await signup("Cy Member", "cy@x.com")).status, 201);
  assert.equal((await signup("Olive Officer", "olive@x.com")).status, 201);

  const bad = await call("POST", "/auth/login", { body: { email: "ann@x.com", password: "wrong" } });
  assert.equal(bad.status, 401);

  const a = await login("ann@x.com");
  adminTok = a.token;
  admin = a.user;
  assert.equal(a.user.role, "admin"); // ADMIN_EMAIL matches
  assert.ok(!("password" in a.user));
  memberTok = (await login("bob@x.com")).token;
  member2Tok = (await login("cy@x.com")).token;
  officerTok = (await login("olive@x.com")).token;

  const me = await call("GET", "/auth/me", { token: memberTok });
  assert.equal(me.data.user.role, "member");
  assert.equal(me.data.user.affiliation, "Alumni");
  assert.equal((await call("GET", "/auth/me")).status, 401);
});

test("admin can promote a member to officer, officers cannot manage users", async () => {
  const list = await call("GET", "/admin/users", { token: adminTok });
  assert.equal(list.status, 200);
  const olive = list.data.users.find((u) => u.email === "olive@x.com");
  assert.equal((await call("GET", "/admin/users", { token: officerTok })).status, 403);
  const r = await call("PATCH", `/admin/users/${olive.id}/role`, { token: adminTok, body: { role: "officer" } });
  assert.equal(r.status, 200);
  assert.equal((await call("GET", "/admin/analytics", { token: officerTok })).status, 200);
  assert.equal((await call("GET", "/admin/analytics", { token: memberTok })).status, 403);
  // cannot change own role
  assert.equal((await call("PATCH", `/admin/users/${admin.id}/role`, { token: adminTok, body: { role: "member" } })).status, 400);
});

test("email verification and password reset", async () => {
  const verifyMail = [...outbox].reverse().find((m) => m.to === "bob@x.com" && /Verify/.test(m.subject));
  const token = verifyMail.text.match(/verify-email\/([a-f0-9]+)/)[1];
  assert.equal((await call("POST", "/auth/verify-email", { body: { token: "nope-nope-nope-nope-nope" } })).status, 400);
  assert.equal((await call("POST", "/auth/verify-email", { body: { token } })).status, 200);
  assert.equal((await call("POST", "/auth/verify-email", { body: { token } })).status, 400); // single use
  assert.equal((await call("GET", "/auth/me", { token: memberTok })).data.user.emailVerified, true);

  const same1 = await call("POST", "/auth/forgot", { body: { email: "bob@x.com" } });
  const same2 = await call("POST", "/auth/forgot", { body: { email: "nobody@x.com" } });
  assert.equal(same1.data.message, same2.data.message); // does not reveal which emails exist
  const resetMail = [...outbox].reverse().find((m) => m.to === "bob@x.com" && /Reset/.test(m.subject));
  const rt = resetMail.text.match(/reset-password\/([a-f0-9]+)/)[1];
  assert.equal((await call("POST", "/auth/reset", { body: { token: rt, password: "short" } })).status, 400);
  assert.equal((await call("POST", "/auth/reset", { body: { token: rt, password: "NewPassw0rd" } })).status, 200);
  assert.equal((await call("POST", "/auth/login", { body: { email: "bob@x.com", password: "Passw0rd!x" } })).status, 401);
  const re = await call("POST", "/auth/login", { body: { email: "bob@x.com", password: "NewPassw0rd" } });
  assert.equal(re.status, 200);
  memberTok = re.data.token;
});

test("profile edit, opt-in directory", async () => {
  const bad = await call("PUT", "/users/me", { token: memberTok, body: { name: "B" } });
  assert.equal(bad.status, 400);
  const r = await call("PUT", "/users/me", {
    token: memberTok,
    body: { name: "Bob Builder", year: "Year 3", skills: "React, Node, react", bio: "Hi", directoryOptIn: true,
      links: { github: "https://github.com/bob", linkedin: "javascript:alert(1)" } }
  });
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.user.skills, ["React", "Node"]); // de-duplicated
  assert.equal(r.data.user.links.linkedin, ""); // unsafe link dropped
  assert.equal((await call("GET", "/users/directory")).status, 401); // members only
  const dir = await call("GET", "/users/directory?q=react", { token: member2Tok });
  assert.equal(dir.data.members.length, 1);
  assert.equal(dir.data.members[0].name, "Bob Builder");
  assert.ok(!("email" in dir.data.members[0])); // emails stay private
  const none = await call("GET", "/users/directory", { token: member2Tok });
  assert.equal(none.data.members.length, 1); // Cy did not opt in
});

let eventId, event2Id, secret;

test("only officers can create events; validation", async () => {
  const body = { title: "Cyber Night", description: "d", date: hours(48), capacity: 1, category: "Workshop" };
  assert.equal((await call("POST", "/events", { token: memberTok, body })).status, 403);
  assert.equal((await call("POST", "/events", { token: officerTok, body: { ...body, title: "" } })).status, 400);
  assert.equal((await call("POST", "/events", { token: officerTok, body: { ...body, date: "garbage" } })).status, 400);
  assert.equal((await call("POST", "/events", { token: officerTok, body: { ...body, endDate: hours(1) } })).status, 400);
  const ok = await call("POST", "/events", { token: officerTok, body });
  assert.equal(ok.status, 201);
  eventId = ok.data.event.id;
  assert.ok(!("checkinSecret" in ok.data.event)); // secret never in public views
  const draft = await call("POST", "/events", { token: officerTok, body: { ...body, title: "Secret Draft", published: false } });
  assert.equal(draft.status, 201);
  const pub = await call("GET", "/events");
  assert.ok(pub.data.events.every((e) => e.title !== "Secret Draft"));
  assert.equal((await call("GET", `/events/${draft.data.event.id}`)).status, 404);
});

test("RSVP with capacity, waitlist and promotion", async () => {
  assert.equal((await call("POST", `/events/${eventId}/rsvp`)).status, 401);
  const r1 = await call("POST", `/events/${eventId}/rsvp`, { token: memberTok });
  assert.equal(r1.data.status, "going");
  assert.equal((await call("POST", `/events/${eventId}/rsvp`, { token: memberTok })).data.status, "going"); // idempotent
  const r2 = await call("POST", `/events/${eventId}/rsvp`, { token: member2Tok });
  assert.equal(r2.data.status, "waitlist"); // capacity is 1

  const view = await call("GET", `/events/${eventId}`, { token: member2Tok });
  assert.equal(view.data.event.going, 1);
  assert.equal(view.data.event.waitlist, 1);
  assert.equal(view.data.event.myStatus, "waitlist");

  const cancel = await call("DELETE", `/events/${eventId}/rsvp`, { token: memberTok });
  assert.equal(cancel.status, 200);
  const after = await call("GET", `/events/${eventId}`, { token: member2Tok });
  assert.equal(after.data.event.myStatus, "going"); // promoted from the waitlist
  assert.ok(outbox.some((m) => m.to === "cy@x.com" && /spot opened/.test(m.subject)));

  // Bob can re-join (goes to the waitlist because the event is full again)
  assert.equal((await call("POST", `/events/${eventId}/rsvp`, { token: memberTok })).data.status, "waitlist");
  // Raising capacity promotes him
  const adm = await call("GET", `/events/${eventId}/admin`, { token: officerTok });
  secret = adm.data.checkinSecret;
  const ev = adm.data.event;
  const upd = await call("PUT", `/events/${eventId}`, { token: officerTok, body: { ...ev, date: ev.date, capacity: 5 } });
  assert.equal(upd.status, 200);
  assert.equal((await call("GET", `/events/${eventId}`, { token: memberTok })).data.event.myStatus, "going");
});

test("check-in rules", async () => {
  // Event is 48h away, so check-in is closed.
  const early = await call("POST", `/events/${eventId}/checkin`, { token: memberTok, body: { secret } });
  assert.equal(early.status, 400);
  assert.match(early.data.message, /not open/);

  // A live event (started 1 hour ago)
  const live = await call("POST", "/events", {
    token: officerTok,
    body: { title: "Live Now", date: hours(-1), endDate: hours(2), capacity: 0, category: "Talk" }
  });
  event2Id = live.data.event.id;
  const s2 = (await call("GET", `/events/${event2Id}/admin`, { token: officerTok })).data.checkinSecret;

  assert.equal((await call("POST", `/events/${event2Id}/checkin`, { token: memberTok, body: { secret: s2 } })).status, 400); // no RSVP
  await call("POST", `/events/${event2Id}/rsvp`, { token: memberTok });
  assert.equal((await call("POST", `/events/${event2Id}/checkin`, { token: memberTok, body: { secret: "wrong" } })).status, 400);
  const ok = await call("POST", `/events/${event2Id}/checkin`, { token: memberTok, body: { secret: s2 } });
  assert.equal(ok.status, 200);

  // officer manual check-in and undo for Cy
  await call("POST", `/events/${event2Id}/rsvp`, { token: member2Tok });
  const cy = (await call("GET", "/auth/me", { token: member2Tok })).data.user;
  assert.equal((await call("PATCH", `/events/${event2Id}/attendance`, { token: officerTok, body: { userId: cy.id, attended: true } })).status, 200);
  assert.equal((await call("PATCH", `/events/${event2Id}/attendance`, { token: memberTok, body: { userId: cy.id, attended: false } })).status, 403);
  assert.equal((await call("PATCH", `/events/${event2Id}/attendance`, { token: officerTok, body: { userId: cy.id, attended: false } })).status, 200);

  // cannot cancel after checking in
  assert.equal((await call("DELETE", `/events/${event2Id}/rsvp`, { token: memberTok })).status, 400);
});

test("feedback only for people who attended", async () => {
  assert.equal((await call("POST", `/events/${event2Id}/feedback`, { token: member2Tok, body: { rating: 5 } })).status, 403);
  assert.equal((await call("POST", `/events/${event2Id}/feedback`, { token: memberTok, body: { rating: 9 } })).status, 400);
  assert.equal((await call("POST", `/events/${event2Id}/feedback`, { token: memberTok, body: { rating: 4, comment: "Great" } })).status, 200);
  assert.equal((await call("POST", `/events/${event2Id}/feedback`, { token: memberTok, body: { rating: 5, comment: "Better" } })).status, 200); // update, not duplicate
  const v = await call("GET", `/events/${event2Id}`, { token: memberTok });
  assert.equal(v.data.feedback.count, 1);
  assert.equal(v.data.feedback.average, 5);
  assert.equal(v.data.feedback.mine.comment, "Better");
});

test("calendar file, my RSVPs, reminders", async () => {
  const ics = await call("GET", `/events/${eventId}/calendar.ics`);
  assert.equal(ics.status, 200);
  assert.match(ics.data, /BEGIN:VEVENT/);
  assert.match(ics.data, /SUMMARY:Cyber Night/);
  const mine = await call("GET", "/events/me/rsvps", { token: memberTok });
  assert.equal(mine.data.events.length, 2);

  // reminder job: an event starting in 10 hours, one going member
  const soon = await call("POST", "/events", { token: officerTok, body: { title: "Tomorrow Talk", date: hours(10), category: "Talk" } });
  await call("POST", `/events/${soon.data.event.id}/rsvp`, { token: memberTok });
  outbox.length = 0;
  assert.equal(await runReminders(db), 1);
  assert.equal(outbox.filter((m) => /Reminder/.test(m.subject)).length, 1);
  assert.equal(await runReminders(db), 0); // only once
});

test("content: news, leaders, resources, sponsors, gallery with roles", async () => {
  const post = { title: "Welcome", body: "Hello club", excerpt: "e", category: "Updates" };
  assert.equal((await call("POST", "/content/news", { token: memberTok, body: post })).status, 403);
  const created = await call("POST", "/content/news", { token: officerTok, body: post });
  assert.equal(created.status, 201);
  assert.equal(created.data.item.author, "Olive Officer");
  await call("POST", "/content/news", { token: officerTok, body: { ...post, title: "Hidden", published: false } });
  const list = await call("GET", "/content/news");
  assert.deepEqual(list.data.items.map((p) => p.title), ["Welcome"]);
  assert.equal((await call("GET", "/content/news/admin/all", { token: officerTok })).data.items.length, 2);
  assert.equal((await call("POST", "/content/news", { token: officerTok, body: { title: "", body: "x" } })).status, 400);

  // leaders and sponsors are admin-only to edit
  assert.equal((await call("POST", "/content/leaders", { token: officerTok, body: { name: "L", position: "President" } })).status, 403);
  assert.equal((await call("POST", "/content/leaders", { token: adminTok, body: { name: "Lee", position: "President", order: 1 } })).status, 201);
  assert.equal((await call("POST", "/content/sponsors", { token: adminTok, body: { name: "Bronze Co", tier: "Bronze" } })).status, 201);
  assert.equal((await call("POST", "/content/sponsors", { token: adminTok, body: { name: "Gold Co", tier: "Gold" } })).status, 201);
  const sp = await call("GET", "/content/sponsors");
  assert.deepEqual(sp.data.items.map((s) => s.name), ["Gold Co", "Bronze Co"]); // sorted by tier

  const res = await call("POST", "/content/resources", { token: officerTok, body: { title: "Guide", url: "javascript:alert(1)" } });
  assert.equal(res.status, 400); // unsafe link rejected
  assert.equal((await call("POST", "/content/resources", { token: officerTok, body: { title: "Guide", url: "https://example.com/g", kind: "doc" } })).status, 201);

  const album = await call("POST", "/content/albums", {
    token: officerTok,
    body: { title: "Hack Night", images: [{ url: "https://example.com/1.jpg", caption: "Team" }, { url: "bad", caption: "x" }] }
  });
  assert.equal(album.status, 201);
  assert.equal(album.data.item.images.length, 1);

  const upd = await call("PUT", `/content/news/${created.data.item.id}`, { token: officerTok, body: { ...post, title: "Welcome!" } });
  assert.equal(upd.data.item.title, "Welcome!");
  assert.equal((await call("DELETE", `/content/news/${created.data.item.id}`, { token: officerTok })).status, 200);
  assert.equal((await call("GET", "/content/nonsense")).status, 404);
});

test("contact form, inbox and stats", async () => {
  const good = { name: "Visitor", email: "v@x.com", message: "Hello there, I would like to join.", consent: true };
  assert.equal((await call("POST", "/contact", { body: { ...good, email: "bad" } })).status, 400);
  assert.equal((await call("POST", "/contact", { body: { ...good, message: "short" } })).status, 400);
  assert.equal((await call("POST", "/contact", { body: { ...good, consent: false } })).status, 400);
  assert.equal((await call("POST", "/contact", { body: { ...good, website: "http://spam" } })).status, 201); // bot: pretend ok
  assert.equal((await call("POST", "/contact", { body: good })).status, 201);

  assert.equal((await call("GET", "/admin/messages", { token: memberTok })).status, 403);
  const inbox = await call("GET", "/admin/messages", { token: officerTok });
  assert.equal(inbox.data.items.length, 1); // the bot message was not saved
  assert.equal((await call("PATCH", `/admin/messages/${inbox.data.items[0].id}`, { token: officerTok, body: { handled: true } })).status, 200);

  const stats = await call("GET", "/public/stats");
  assert.equal(stats.status, 200);
  assert.ok(stats.data.members >= 5);
  assert.ok(stats.data.upcomingEvents >= 2);
  assert.equal(stats.data.eventsHeld, 0);
});

test("analytics, CSV exports (with formula protection) and audit log", async () => {
  const an = await call("GET", "/admin/analytics", { token: adminTok });
  assert.equal(an.data.growth.length, 12);
  assert.equal(an.data.growth[11].total, an.data.totals.members);
  assert.ok(an.data.perEvent.some((e) => e.title === "Live Now" && e.attended === 1 && e.averageRating === 5));

  // a member whose name starts with "=" must not become a spreadsheet formula
  await call("PUT", "/users/me", { token: member2Tok, body: { name: "=HYPERLINK(evil)" } });
  const csv = await call("GET", "/admin/export/members.csv", { token: adminTok });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /text\/csv/);
  assert.match(csv.data, /"'=HYPERLINK\(evil\)"/);
  assert.equal((await call("GET", "/admin/export/members.csv", { token: officerTok })).status, 403);

  const att = await call("GET", `/events/${event2Id}/attendees.csv`, { token: officerTok });
  assert.equal(att.status, 200);
  assert.match(att.data, /Bob Builder/);

  const log = await call("GET", "/admin/audit", { token: adminTok });
  const actions = log.data.logs.map((l) => l.action);
  for (const a of ["event.create", "user.role", "export.members", "news.create"]) assert.ok(actions.includes(a), a);
  assert.equal((await call("GET", "/admin/audit", { token: officerTok })).status, 403);
});

test("registrations (class dashboard) now need a login", async () => {
  assert.equal((await call("GET", "/registrations")).status, 401);
  const body = { name: "Stu", regNumber: "R1", department: "Business", event: "AI Innovation Day" };
  const c = await call("POST", "/registrations", { token: memberTok, body });
  assert.equal(c.status, 201);
  assert.equal((await call("GET", "/registrations", { token: memberTok })).data.length, 1);
  assert.equal((await call("PUT", `/registrations/${c.data.id}`, { token: memberTok, body: { ...body, name: "Stu2" } })).status, 200);
  assert.equal((await call("DELETE", `/registrations/${c.data.id}`, { token: memberTok })).status, 200);
});

test("data export and account deletion", async () => {
  const exp = await call("GET", "/users/me/export", { token: memberTok });
  assert.equal(exp.status, 200);
  assert.equal(exp.data.profile.email, "bob@x.com");
  assert.ok(exp.data.rsvps.length >= 2);
  assert.ok(!JSON.stringify(exp.data).includes("password"));

  assert.equal((await call("DELETE", "/users/me", { token: memberTok, body: { password: "wrong" } })).status, 400);
  assert.equal((await call("DELETE", "/users/me", { token: adminTok, body: { password: "Passw0rd!x" } })).status, 400); // only admin
  assert.equal((await call("DELETE", "/users/me", { token: memberTok, body: { password: "NewPassw0rd" } })).status, 200);
  assert.equal((await call("GET", "/auth/me", { token: memberTok })).status, 401); // token no longer works
  assert.equal(await db.collection("rsvps").countDocuments({ status: "going", attended: true }), 0);
});

test("admin can delete another user; bad input is handled safely", async () => {
  const list = await call("GET", "/admin/users?q=cy@", { token: adminTok });
  assert.equal(list.data.users.length, 1);
  assert.equal((await call("DELETE", `/admin/users/${list.data.users[0].id}`, { token: adminTok })).status, 200);
  assert.equal((await call("GET", "/events/not-an-id")).status, 404);
  const broken = await fetch(base + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops" });
  assert.equal(broken.status, 400);
  assert.equal((await call("GET", "/nothing-here")).status, 404);
});

test("the very first account on an empty database becomes admin", async () => {
  const fresh = new FakeDb();
  const srv = createApp(fresh).listen(0);
  try {
    const url = `http://127.0.0.1:${srv.address().port}`;
    const post = (path, body) => fetch(url + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
    await post("/auth/signup", { name: "First Person", email: "first@x.com", password: "Passw0rd!x", consent: true });
    await post("/auth/signup", { name: "Second Person", email: "second@x.com", password: "Passw0rd!x", consent: true });
    assert.equal((await post("/auth/login", { email: "first@x.com", password: "Passw0rd!x" })).user.role, "admin");
    assert.equal((await post("/auth/login", { email: "second@x.com", password: "Passw0rd!x" })).user.role, "member");
  } finally {
    srv.close();
  }
});
