
const mongoose = require("mongoose");

const Blog = require("../models/Blog");
const Reaction = require("../models/Reaction");
const Rating = require("../models/Rating");
const Comment = require("../models/Comment");
const Bookmark = require("../models/Bookmark");

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

async function findPublishedBlog(blogId) {
  if (!isValidId(blogId)) return null;

  return Blog.findOne({
    _id: blogId,
    status: "published",
  }).select("_id title slug");
}

// POST /api/engagement/:blogId/reaction
// Body: { "type": "like" } or { "type": "dislike" }
async function setReaction(req, res, next) {
  try {
    const { blogId } = req.params;
    const { type } = req.body;

    if (!["like", "dislike"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Reaction type must be "like" or "dislike".',
      });
    }

    const blog = await findPublishedBlog(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    const reaction = await Reaction.findOneAndUpdate(
      { blog: blog._id, user: req.user._id },
      { $set: { type } },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Reaction saved.",
      reaction: {
        blog: reaction.blog,
        type: reaction.type,
      },
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/engagement/:blogId/reaction
async function removeReaction(req, res, next) {
  try {
    const blog = await findPublishedBlog(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    await Reaction.findOneAndDelete({
      blog: blog._id,
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Reaction removed.",
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/engagement/:blogId/rating
// Body: { "value": 1 } through { "value": 5 }
async function setRating(req, res, next) {
  try {
    const { value } = req.body;

    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number from 1 to 5.",
      });
    }

    const blog = await findPublishedBlog(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    const rating = await Rating.findOneAndUpdate(
      { blog: blog._id, user: req.user._id },
      { $set: { value } },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Rating saved.",
      rating: {
        blog: rating.blog,
        value: rating.value,
      },
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/engagement/:blogId/rating
async function removeRating(req, res, next) {
  try {
    const blog = await findPublishedBlog(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    await Rating.findOneAndDelete({
      blog: blog._id,
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Rating removed.",
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/engagement/:blogId/comments
// New comments require administrator approval.
async function createComment(req, res, next) {
  try {
    const content =
      typeof req.body.content === "string"
        ? req.body.content.trim()
        : "";

    if (content.length < 1 || content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment must contain 1–2000 characters.",
      });
    }

    const blog = await findPublishedBlog(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    const comment = await Comment.create({
      blog: blog._id,
      user: req.user._id,
      content,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Comment submitted for administrator approval.",
      comment: {
        id: comment._id,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/engagement/:blogId/comments
// Public: approved comments only.
async function getApprovedComments(req, res, next) {
  try {
    const blog = await findPublishedBlog(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const filter = {
      blog: blog._id,
      status: "approved",
    };

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Comment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/engagement/admin/comments
// Administrator: list comments for moderation.
async function getCommentsForModeration(req, res, next) {
  try {
    const comments = await Comment.find()
      .populate("user", "name email")
      .populate("blog", "title slug status")
      .sort({ status: 1, createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/engagement/admin/comments/:commentId
// Body: { "status": "approved" } or { "status": "rejected" }
async function moderateComment(req, res, next) {
  try {
    if (!isValidId(req.params.commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID.",
      });
    }

    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "approved" or "rejected".',
      });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { status },
      { new: true, runValidators: true }
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Comment ${status}.`,
      comment,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/engagement/admin/comments/:commentId
async function deleteComment(req, res, next) {
  try {
    if (!isValidId(req.params.commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID.",
      });
    }

    const comment = await Comment.findByIdAndDelete(
      req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/engagement/:blogId/bookmark
async function addBookmark(req, res, next) {
  try {
    const blog = await findPublishedBlog(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    await Bookmark.updateOne(
      { blog: blog._id, user: req.user._id },
      {
        $setOnInsert: {
          blog: blog._id,
          user: req.user._id,
        },
      },
      {
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Blog saved to your reading list.",
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/engagement/:blogId/bookmark
async function removeBookmark(req, res, next) {
  try {
    const blog = await findPublishedBlog(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    await Bookmark.findOneAndDelete({
      blog: blog._id,
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Blog removed from your reading list.",
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/engagement/bookmarks/me
async function getMyBookmarks(req, res, next) {
  try {
    const bookmarks = await Bookmark.find({
      user: req.user._id,
    })
      .populate({
        path: "blog",
        match: { status: "published" },
        select:
          "title slug excerpt coverImage category tags readTime createdAt",
        populate: {
          path: "author",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      bookmarks: bookmarks
        .filter((item) => item.blog)
        .map((item) => ({
          savedAt: item.createdAt,
          blog: item.blog,
        })),
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/engagement/:blogId/summary
// Public: aggregate statistics for a published blog.
async function getEngagementSummary(req, res, next) {
  try {
    const blog = await findPublishedBlog(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    const [reactionCounts, ratingStats, commentCount] =
      await Promise.all([
        Reaction.aggregate([
          { $match: { blog: blog._id } },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
            },
          },
        ]),

        Rating.aggregate([
          { $match: { blog: blog._id } },
          {
            $group: {
              _id: null,
              average: { $avg: "$value" },
              count: { $sum: 1 },
            },
          },
        ]),

        Comment.countDocuments({
          blog: blog._id,
          status: "approved",
        }),
      ]);

    const reactions = {
      likes: 0,
      dislikes: 0,
    };

    for (const item of reactionCounts) {
      if (item._id === "like") reactions.likes = item.count;
      if (item._id === "dislike") reactions.dislikes = item.count;
    }

    const stats = ratingStats[0];

    return res.status(200).json({
      success: true,
      summary: {
        likes: reactions.likes,
        dislikes: reactions.dislikes,
        averageRating: stats
          ? Number(stats.average.toFixed(2))
          : 0,
        ratingCount: stats ? stats.count : 0,
        approvedComments: commentCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/engagement/admin/analytics
// Administrator: aggregate platform engagement statistics.
async function getAdminAnalytics(_req, res) {
  try {
    const [
      blogStats,
      blogCounts,
      reactionStats,
      ratingStats,
      commentStats,
      totalBookmarks,
      mostViewed,
    ] = await Promise.all([
      Blog.aggregate([
        {
          $group: {
            _id: null,
            totalViews: {
              $sum: { $ifNull: ["$views", 0] },
            },
          },
        },
      ]),

      Blog.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Reaction.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),

      Rating.aggregate([
        {
          $group: {
            _id: null,
            totalRatings: { $sum: 1 },
            averageRating: { $avg: "$value" },
          },
        },
      ]),

      Comment.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Bookmark.countDocuments(),

      Blog.find({ status: "published" })
        .select("title slug category views status")
        .sort({ views: -1 })
        .limit(10)
        .lean(),
    ]);

    const countFor = (items, key) =>
      items.find((item) => item._id === key)?.count || 0;

    const ratingSummary = ratingStats[0] || {
      totalRatings: 0,
      averageRating: 0,
    };

    return res.status(200).json({
      success: true,
      analytics: {
        totalBlogs: blogCounts.reduce(
          (total, item) => total + item.count,
          0
        ),
        publishedBlogs: countFor(blogCounts, "published"),
        draftBlogs: countFor(blogCounts, "draft"),
        totalViews: blogStats[0]?.totalViews || 0,
        totalLikes: countFor(reactionStats, "like"),
        totalDislikes: countFor(reactionStats, "dislike"),
        totalRatings: ratingSummary.totalRatings,
        averageRating: Number(
          (ratingSummary.averageRating || 0).toFixed(1)
        ),
        pendingComments: countFor(commentStats, "pending"),
        approvedComments: countFor(commentStats, "approved"),
        rejectedComments: countFor(commentStats, "rejected"),
        totalBookmarks,
        mostViewed,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load platform analytics.",
    });
  }
}

module.exports = {
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
};
