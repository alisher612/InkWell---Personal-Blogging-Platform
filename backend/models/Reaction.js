
const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  { timestamps: true }
);

reactionSchema.index({ blog: 1, user: 1 }, { unique: true });
reactionSchema.index({ blog: 1, type: 1 });

module.exports = mongoose.model("Reaction", reactionSchema);
