const express = require("express");
const { ObjectId } = require("mongodb");
const { requireAuth } = require("../lib/auth");
const router = express.Router();

// Only logged-in members can use the class registration dashboard.
router.use(requireAuth);

// Validate the four required string fields
function readFields(body) {
  const { name, regNumber, department, event } = body;
  const ok = [name, regNumber, department, event].every(
    v => typeof v === "string" && v.trim()
  );
  if (!ok) return null;
  return {
    name: name.trim(),
    regNumber: regNumber.trim(),
    department: department.trim(),
    event: event.trim()
  };
}

// CREATE
router.post("/", async (req, res) => {
  try {
    const fields = readFields(req.body);
    if (!fields) return res.status(400).json({ message: "All fields are required" });

    const registrations = req.app.locals.db.collection("registrations");
    const result = await registrations.insertOne({ ...fields, createdAt: new Date() });
    res.status(201).json({
      message: "Registration saved successfully",
      id: result.insertedId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save registration" });
  }
});

// READ (newest first)
router.get("/", async (req, res) => {
  try {
    const registrations = req.app.locals.db.collection("registrations");
    const students = await registrations.find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve registrations" });
  }
});

// UPDATE (edit an entry)
router.put("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid registration id" });
    }
    const fields = readFields(req.body);
    if (!fields) return res.status(400).json({ message: "All fields are required" });

    const registrations = req.app.locals.db.collection("registrations");
    const result = await registrations.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...fields, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json({ message: "Registration updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update registration" });
  }
});

// DELETE (optional extra)
router.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid registration id" });
    }
    const registrations = req.app.locals.db.collection("registrations");
    const result = await registrations.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json({ message: "Registration deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete registration" });
  }
});

module.exports = router;
