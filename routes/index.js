var express = require("express");
var router = express.Router();
const Note = require("../models/note");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId });
    res.json(notes);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
