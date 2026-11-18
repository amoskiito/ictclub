const express = require("express");
const { wrap, fail, toId } = require("../lib/http");
const { parseFields } = require("../lib/validate");
const { requireRole } = require("../lib/auth");
const { audit } = require("../lib/audit");

const router = express.Router();

const TIERS = ["Gold", "Silver", "Bronze", "Partner"];

// One generic set of routes serves every simple content type.
// "writeRole" is the minimum role allowed to add, edit or delete.
const TYPES = {
  news: {
    collection: "posts", writeRole: "officer", publicFilter: { published: { $ne: false } }, sort: { createdAt: -1 },
    addAuthor: true,
    fields: {
      title: { t: "str", max: 140, req: true, label: "Title" },
      excerpt: { t: "str", max: 300 },
      category: { t: "str", max: 40 },
      body: { t: "str", max: 20000, req: true, label: "Body" },
      published: { t: "bool", def: true }
    }
  },
  leaders: {
    collection: "leaders", writeRole: "admin", sort: { order: 1 },
    fields: {
      name: { t: "str", max: 80, req: true, label: "Name" },
      position: { t: "str", max: 80, req: true, label: "Position" },
      bio: { t: "str", max: 600 },
      photoUrl: { t: "url" },
      linkedin: { t: "url" },
      github: { t: "url" },
      order: { t: "int", min: 0, max: 999, def: 100 }
    }
  },
  resources: {
    collection: "resources", writeRole: "officer", sort: { createdAt: -1 },
    fields: {
      title: { t: "str", max: 120, req: true, label: "Title" },
      url: { t: "url", req: true, label: "A valid link (starting with http:// or https://)" },
      kind: { t: "enum", values: ["doc", "link", "newsletter", "form"], def: "link" },
      description: { t: "str", max: 300 }
    }
  },
  sponsors: {
    collection: "sponsors", writeRole: "admin", sort: { createdAt: 1 },
    fields: {
      name: { t: "str", max: 80, req: true, label: "Name" },
      url: { t: "url" },
      tier: { t: "enum", values: TIERS, def: "Partner" },
      logoUrl: { t: "url" },
      blurb: { t: "str", max: 240 }
    }
  },
  albums: {
    collection: "albums", writeRole: "officer", sort: { createdAt: -1 },
    fields: {
      title: { t: "str", max: 100, req: true, label: "Title" },
      description: { t: "str", max: 300 },
      eventId: { t: "str", max: 24 },
      coverEmoji: { t: "str", max: 8 },
      images: { t: "images" }
    }
  }
};

const present = (doc) => {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
};

function typeOf(req, res, next) {
  const type = TYPES[req.params.name];
  if (!type) return fail(res, 404, "Not found");
  req.type = type;
  next();
}

const writer = (req, res, next) => requireRole(req.type.writeRole)(req, res, next);

router.get("/:name", typeOf, wrap(async (req, res) => {
  let items = await req.app.locals.db
    .collection(req.type.collection)
    .find(req.type.publicFilter || {})
    .sort(req.type.sort)
    .toArray();
  if (req.params.name === "sponsors") {
    items.sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || a.name.localeCompare(b.name));
  }
  res.json({ items: items.map(present) });
}));

// Everything including drafts, for the admin dashboard.
router.get("/:name/admin/all", typeOf, writer, wrap(async (req, res) => {
  const items = await req.app.locals.db.collection(req.type.collection).find({}).sort(req.type.sort).toArray();
  res.json({ items: items.map(present) });
}));

router.get("/:name/:id", typeOf, wrap(async (req, res) => {
  const id = toId(req.params.id);
  const doc = id ? await req.app.locals.db.collection(req.type.collection).findOne({ _id: id }) : null;
  if (!doc || (req.type.publicFilter && doc.published === false)) return fail(res, 404, "Not found");
  res.json({ item: present(doc) });
}));

router.post("/:name", typeOf, writer, wrap(async (req, res) => {
  const { data, error } = parseFields(req.type.fields, req.body);
  if (error) return fail(res, 400, error);
  const doc = { ...data, createdAt: new Date() };
  if (req.type.addAuthor) doc.author = req.user.name;
  const r = await req.app.locals.db.collection(req.type.collection).insertOne(doc);
  await audit(req, `${req.params.name}.create`, req.params.name, r.insertedId, { title: data.title || data.name });
  res.status(201).json({ item: present({ ...doc, _id: r.insertedId }) });
}));

router.put("/:name/:id", typeOf, writer, wrap(async (req, res) => {
  const id = toId(req.params.id);
  const coll = req.app.locals.db.collection(req.type.collection);
  const existing = id ? await coll.findOne({ _id: id }) : null;
  if (!existing) return fail(res, 404, "Not found");
  const { data, error } = parseFields(req.type.fields, req.body);
  if (error) return fail(res, 400, error);
  await coll.updateOne({ _id: id }, { $set: { ...data, updatedAt: new Date() } });
  await audit(req, `${req.params.name}.update`, req.params.name, id, { title: data.title || data.name });
  res.json({ item: present({ ...existing, ...data }) });
}));

router.delete("/:name/:id", typeOf, writer, wrap(async (req, res) => {
  const id = toId(req.params.id);
  const coll = req.app.locals.db.collection(req.type.collection);
  const existing = id ? await coll.findOne({ _id: id }) : null;
  if (!existing) return fail(res, 404, "Not found");
  await coll.deleteOne({ _id: id });
  await audit(req, `${req.params.name}.delete`, req.params.name, id, { title: existing.title || existing.name });
  res.json({ message: "Deleted" });
}));

module.exports = router;
