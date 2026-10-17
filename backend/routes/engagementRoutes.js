
const express = require("express");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const {
  setReaction,
  removeReaction,
  setRating,
  removeRating,
  createComment,
  getApprovedComments,
  getCommentsForModeration,
  moderateComment,
  deleteComment,
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  getEngagementSummary,
  getAdminAnalytics,
} = require("../controllers/engagementController");

const router = express.Router();

// --------------------------------------------------
// Administrator endpoints
// --------------------------------------------------

// GET /api/engagement/admin/analytics
router.get(
  "/admin/analytics",
  protect,
  adminOnly,
  getAdminAnalytics
);

// GET /api/engagement/admin/comments
router.get(
  "/admin/comments",
  protect,
  adminOnly,
  getCommentsForModeration
);

// PATCH /api/engagement/admin/comments/:commentId
router.patch(
  "/admin/comments/:commentId",
  protect,
  adminOnly,
  moderateComment
);

// DELETE /api/engagement/admin/comments/:commentId
router.delete(
  "/admin/comments/:commentId",
  protect,
  adminOnly,
  deleteComment
);

// --------------------------------------------------
// Authenticated user's bookmarks
// --------------------------------------------------

// GET /api/engagement/bookmarks/me
router.get("/bookmarks/me", protect, getMyBookmarks);

// PUT /api/engagement/:blogId/bookmark
router.put("/:blogId/bookmark", protect, addBookmark);

// DELETE /api/engagement/:blogId/bookmark
router.delete("/:blogId/bookmark", protect, removeBookmark);

// --------------------------------------------------
// Public blog endpoints
// --------------------------------------------------

// GET /api/engagement/:blogId/summary
router.get("/:blogId/summary", getEngagementSummary);

// GET /api/engagement/:blogId/comments
router.get("/:blogId/comments", getApprovedComments);

// --------------------------------------------------
// Authenticated blog engagement
// --------------------------------------------------

// POST /api/engagement/:blogId/reaction
router.post("/:blogId/reaction", protect, setReaction);

// DELETE /api/engagement/:blogId/reaction
router.delete("/:blogId/reaction", protect, removeReaction);

// PUT /api/engagement/:blogId/rating
router.put("/:blogId/rating", protect, setRating);

// DELETE /api/engagement/:blogId/rating
router.delete("/:blogId/rating", protect, removeRating);

// POST /api/engagement/:blogId/comments
router.post("/:blogId/comments", protect, createComment);

module.exports = router;
