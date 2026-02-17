const express = require("express");
const router = express.Router();

const Note = require("../models/note");
const User = require("../models/User");
const auth = require("../middleware/auth");

// ======================================
// 1. GET ALL NOTES (owned + shared)
// ======================================
router.get("/", auth, async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [{ owner: req.userId }, { "sharedWith.user": req.userId }],
    }).populate("owner", "email");

    res.json(notes);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// ======================================
// 2. ADD NOTE
// ======================================
router.post("/", auth, async (req, res) => {
  try {
    const note = new Note({
      text: req.body.note,
      owner: req.userId,
      sharedWith: [],
    });

    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).send("Error creating note");
  }
});

// ======================================
// 3. DELETE NOTE
// ======================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found");

    const isOwner = note.owner.toString() === req.userId;

    const sharedEditor = note.sharedWith.find(
      (s) => s.user.toString() === req.userId && s.role === "editor",
    );

    if (!isOwner && !sharedEditor) return res.status(403).send("No permission");

    await note.deleteOne();
    res.send("Deleted successfully");
  } catch (err) {
    res.status(500).send("Delete failed");
  }
});

// ======================================
// 4. UPDATE NOTE
// ======================================
router.put("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found");

    const isOwner = note.owner.toString() === req.userId;

    const sharedEditor = note.sharedWith.find(
      (s) => s.user.toString() === req.userId && s.role === "editor",
    );

    if (!isOwner && !sharedEditor) return res.status(403).send("No permission");

    note.text = req.body.note;
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).send("Update failed");
  }
});

// ======================================
// 5. SHARE NOTE
// ======================================
router.post("/:id/share", auth, async (req, res) => {
  try {
    const { email, role } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    // 2. Find note
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found");

    // 3. Only owner can share
    if (note.owner.toString() !== req.userId)
      return res.status(403).send("Only owner can share");

    // 4. Prevent duplicate share
    const already = note.sharedWith.find(
      (s) => s.user.toString() === user._id.toString(),
    );
    if (already) return res.send("Already shared with this user");

    // 5. Add share
    note.sharedWith.push({
      user: user._id,
      role: role || "viewer",
    });

    await note.save();
    res.send("Shared successfully");
  } catch (err) {
    res.status(500).send("Share failed");
  }
});

// ======================================
// 6. REMOVE SHARE
// ======================================
router.post("/:id/unshare", auth, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found");

    if (note.owner.toString() !== req.userId)
      return res.status(403).send("Only owner can unshare");

    note.sharedWith = note.sharedWith.filter(
      (s) => s.user.toString() !== user._id.toString(),
    );

    await note.save();
    res.send("Unshared successfully");
  } catch (err) {
    res.status(500).send("Unshare failed");
  }
});

module.exports = router;
