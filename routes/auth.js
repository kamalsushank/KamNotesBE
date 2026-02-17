var express = require("express");
var router = express.Router();

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = "mysecret";

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });
  await user.save();
  res.send("User created");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("User not found");
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).send("Wrong password");
  const token = jwt.sign({ id: user._id }, SECRET);
  res.json({ token });
});
module.exports = router;
