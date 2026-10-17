const express = require("express");
const { body } = require("express-validator");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getPublishedBlogs,
  getAllBlogsForAdmin,
  getBlogBySlug,
  createBlog,
  updateBlog,
  setBlogStatus,
  deleteBlog,
} = require("../controllers/blogController");

const router = express.Router();

const createBlogValidation = [
  body("title")
    .isString()
    .trim()
    .isLength({ min: 5, max: 160 })
    .withMessage("Title must contain 5–160 characters."),

  body("authorName")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 80 })
    .withMessage("Author name is required and cannot exceed 80 characters."),

  body("excerpt")
    .isString()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage("Excerpt must contain 1–300 characters."),

  body("content")
    .isString()
    .trim()
    .isLength({ min: 50 })
    .withMessage("Content must contain at least 50 characters."),

  body("category")
    .isString()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage("A category is required (maximum 60 characters)."),

  body("coverImage")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Cover image URL cannot exceed 1000 characters."),

  body("coverImagePublicId")
    .optional()
    .isString(),

  body("tags")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Tags must be an array containing at most 20 items."),

  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 40 })
    .withMessage("Each tag must be a string of at most 40 characters."),

  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage('Status must be "draft" or "published".'),
];

const updateBlogValidation = [
  body("title")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 160 })
    .withMessage("Title must contain 5–160 characters."),

  body("authorName")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 80 })
    .withMessage("Author name must contain 1–80 characters."),

  body("excerpt")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage("Excerpt must contain 1–300 characters."),

  body("content")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 50 })
    .withMessage("Content must contain at least 50 characters."),

  body("category")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage("Category must contain 1–60 characters."),

  body("coverImage")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Cover image URL cannot exceed 1000 characters."),

  body("coverImagePublicId")
    .optional()
    .isString(),

  body("tags")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Tags must be an array containing at most 20 items."),

  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 40 })
    .withMessage("Each tag must be a string of at most 40 characters."),

  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage('Status must be "draft" or "published".'),
];

// Public routes
router.get("/", getPublishedBlogs);

// Keep this route above "/:slug".
router.get("/admin/all", protect, adminOnly, getAllBlogsForAdmin);

router.get("/:slug", getBlogBySlug);

// Administrator-only routes
router.post("/", protect, adminOnly, createBlogValidation, createBlog);

router.patch("/:id/publish", protect, adminOnly, setBlogStatus);

router.patch("/:id", protect, adminOnly, updateBlogValidation, updateBlog);

router.delete("/:id", protect, adminOnly, deleteBlog);

module.exports = router;