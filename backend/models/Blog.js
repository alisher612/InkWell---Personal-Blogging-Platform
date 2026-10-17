const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required."],
      trim: true,
      minlength: [5, "Title must contain at least 5 characters."],
      maxlength: [160, "Title cannot exceed 160 characters."],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    excerpt: {
      type: String,
      required: [true, "Blog excerpt is required."],
      trim: true,
      maxlength: [300, "Excerpt cannot exceed 300 characters."],
    },

    content: {
      type: String,
      required: [true, "Blog content is required."],
      minlength: [50, "Blog content must contain at least 50 characters."],
    },

    coverImage: {
      type: String,
      default: "",
      trim: true,
    },

    // Public ID stored to manage Cloudinary deletion
    coverImagePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Blog category is required."],
      trim: true,
      maxlength: 60,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    // Account responsible for creating the article.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Public byline entered in the admin article form.
    authorName: {
      type: String,
      trim: true,
      maxlength: [80, "Author name cannot exceed 80 characters."],
      default: "",
    },

    readTime: {
      type: Number,
      default: 1,
      min: 1,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ title: "text", excerpt: "text", content: "text" });

module.exports = mongoose.model("Blog", blogSchema);