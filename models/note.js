const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  text: String,

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  sharedWith: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["viewer", "editor"],
        default: "viewer",
      },
    },
  ],
});

module.exports = mongoose.model("Note", noteSchema);
