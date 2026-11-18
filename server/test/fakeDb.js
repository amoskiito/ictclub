// A tiny in-memory stand-in for the MongoDB driver, so the API tests run
// without installing or starting MongoDB. It supports only what this app uses.
const { ObjectId } = require("mongodb");

const isObj = (v) => v && typeof v === "object" && !(v instanceof Date) && !(v instanceof ObjectId) && !Array.isArray(v);

function clone(v) {
  if (v instanceof Date) return new Date(v.getTime());
  if (v instanceof ObjectId) return v;
  if (Array.isArray(v)) return v.map(clone);
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]));
  return v;
}

const norm = (v) => (v instanceof ObjectId ? "oid:" + v.toString() : v instanceof Date ? v.getTime() : v);
const same = (a, b) => {
  if (a === undefined) a = null;
  if (b === undefined) b = null;
  return norm(a) === norm(b);
};

function cmpValue(a, b) {
  const x = norm(a), y = norm(b);
  if (x === y) return 0;
  return x > y ? 1 : -1;
}

function matchField(value, cond) {
  if (isObj(cond) && Object.keys(cond).some((k) => k.startsWith("$"))) {
    return Object.entries(cond).every(([op, arg]) => {
      switch (op) {
        case "$in": return arg.some((a) => (Array.isArray(value) ? value.some((x) => same(x, a)) : same(value, a)));
        case "$nin": return !arg.some((a) => same(value, a));
        case "$ne": return !same(value, arg);
        case "$gt": return value != null && cmpValue(value, arg) > 0;
        case "$gte": return value != null && cmpValue(value, arg) >= 0;
        case "$lt": return value != null && cmpValue(value, arg) < 0;
        case "$lte": return value != null && cmpValue(value, arg) <= 0;
        case "$exists": return (value !== undefined) === arg;
        default: throw new Error("fakeDb: unsupported operator " + op);
      }
    });
  }
  if (Array.isArray(value)) return value.some((x) => same(x, cond));
  return same(value, cond);
}

function matches(doc, filter) {
  return Object.entries(filter || {}).every(([k, cond]) => {
    if (k === "$or") return cond.some((f) => matches(doc, f));
    if (k === "$and") return cond.every((f) => matches(doc, f));
    return matchField(doc[k], cond);
  });
}

class Cursor {
  constructor(docs) { this.docs = docs; }
  sort(spec) {
    const keys = Object.entries(spec);
    this.docs.sort((a, b) => {
      for (const [k, dir] of keys) {
        const c = cmpValue(a[k] ?? null, b[k] ?? null);
        if (c) return c * dir;
      }
      return 0;
    });
    return this;
  }
  limit(n) { this.docs = this.docs.slice(0, n); return this; }
  skip(n) { this.docs = this.docs.slice(n); return this; }
  async toArray() { return this.docs.map(clone); }
}

class Collection {
  constructor() { this.docs = []; this.uniques = []; }
  async createIndex(keys, opts = {}) { if (opts.unique) this.uniques.push(Object.keys(keys)); return "ok"; }
  checkUnique(doc, ignore) {
    for (const keys of this.uniques) {
      const dup = this.docs.find((d) => d !== ignore && keys.every((k) => same(d[k], doc[k])));
      if (dup) { const e = new Error("E11000 duplicate key"); e.code = 11000; throw e; }
    }
  }
  async insertOne(doc) {
    const d = clone(doc);
    if (!d._id) d._id = new ObjectId();
    this.checkUnique(d);
    this.docs.push(d);
    doc._id = d._id;
    return { insertedId: d._id };
  }
  find(filter) { return new Cursor(this.docs.filter((d) => matches(d, filter))); }
  async findOne(filter) { const d = this.docs.find((x) => matches(x, filter)); return d ? clone(d) : null; }
  async countDocuments(filter) { return this.docs.filter((d) => matches(d, filter)).length; }
  applyUpdate(doc, update) {
    for (const [op, fields] of Object.entries(update)) {
      for (const [k, v] of Object.entries(fields)) {
        if (op === "$set") doc[k] = clone(v);
        else if (op === "$inc") doc[k] = (doc[k] || 0) + v;
        else if (op === "$unset") delete doc[k];
        else throw new Error("fakeDb: unsupported update " + op);
      }
    }
  }
  async updateOne(filter, update) {
    const d = this.docs.find((x) => matches(x, filter));
    if (!d) return { matchedCount: 0, modifiedCount: 0 };
    const copy = clone(d);
    this.applyUpdate(copy, update);
    this.checkUnique(copy, d);
    Object.assign(d, copy);
    return { matchedCount: 1, modifiedCount: 1 };
  }
  async updateMany(filter, update) {
    const hits = this.docs.filter((x) => matches(x, filter));
    hits.forEach((d) => this.applyUpdate(d, update));
    return { matchedCount: hits.length, modifiedCount: hits.length };
  }
  async deleteOne(filter) {
    const i = this.docs.findIndex((x) => matches(x, filter));
    if (i >= 0) this.docs.splice(i, 1);
    return { deletedCount: i >= 0 ? 1 : 0 };
  }
  async deleteMany(filter) {
    const before = this.docs.length;
    this.docs = this.docs.filter((d) => !matches(d, filter));
    return { deletedCount: before - this.docs.length };
  }
}

class FakeDb {
  constructor() { this.collections = {}; }
  collection(name) { return (this.collections[name] ||= new Collection()); }
}

module.exports = { FakeDb };
