
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
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
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5.",
      },
    },
  },
  { timestamps: true }
);

ratingSchema.index({ blog: 1, user: 1 }, { unique: true });
ratingSchema.index({ blog: 1 });

module.exports = mongoose.model("Rating", ratingSchema);
