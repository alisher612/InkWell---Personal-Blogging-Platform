const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;
const Blog = require("../models/Blog");

function createSlug(title) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function calculateReadTime(content) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function handleValidationErrors(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Please correct the invalid fields.",
      errors: errors.array(),
    });
    return true;
  }

  return false;
}

async function generateUniqueSlug(title, excludedId = null) {
  const baseSlug = createSlug(title) || "blog";
  let slug = baseSlug;
  let counter = 1;

  while (
    await Blog.exists({
      slug,
      ...(excludedId ? { _id: { $ne: excludedId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

// Helper to handle cover images (uploading external URLs to Cloudinary)
async function processCoverImage(coverImage, coverImagePublicId) {
  if (!coverImage || typeof coverImage !== "string" || !coverImage.trim()) {
    return { coverImage: "", coverImagePublicId: "" };
  }

  const trimmedImage = coverImage.trim();

  // If already hosted on Cloudinary, preserve existing URL and Public ID
  if (trimmedImage.includes("res.cloudinary.com")) {
    return {
      coverImage: trimmedImage,
      coverImagePublicId: coverImagePublicId || "",
    };
  }

  // If an external web URL is pasted, upload it to Cloudinary first
  if (trimmedImage.startsWith("http://") || trimmedImage.startsWith("https://")) {
    try {
      const uploadResult = await cloudinary.uploader.upload(trimmedImage, {
        folder: "inkwell_covers",
      });

      return {
        coverImage: uploadResult.secure_url,
        coverImagePublicId: uploadResult.public_id,
      };
    } catch (err) {
      console.error("Failed to upload external cover URL to Cloudinary:", err);
      // Fallback to saving original URL if Cloudinary upload fails
      return { coverImage: trimmedImage, coverImagePublicId: "" };
    }
  }

  return { coverImage: trimmedImage, coverImagePublicId: coverImagePublicId || "" };
}

// GET /api/blogs
// Public: list published blogs with pagination and filters.
async function getPublishedBlogs(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 9)
    );

    const filter = { status: "published" };

    if (req.query.category) {
      filter.category = new RegExp(
        `^${escapeRegex(String(req.query.category).trim())}$`,
        "i"
      );
    }

    if (req.query.tag) {
      filter.tags = String(req.query.tag).trim().toLowerCase();
    }

    if (req.query.search) {
      const search = escapeRegex(String(req.query.search).trim());

      if (search) {
        filter.$or = [
          { title: new RegExp(search, "i") },
          { excerpt: new RegExp(search, "i") },
          { content: new RegExp(search, "i") },
        ];
      }
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .select("-content")
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      blogs,
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

// GET /api/blogs/admin/all
// Administrator: list both drafts and published blogs.
async function getAllBlogsForAdmin(req, res, next) {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/blogs/:slug
// Public: read a published blog.
async function getBlogBySlug(req, res, next) {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: "published" },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found.",
      });
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/blogs
// Administrator: create a blog.
async function createBlog(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const {
      title,
      excerpt,
      content,
      coverImage,
      coverImagePublicId,
      category,
      tags,
      status,
      authorName,
    } = req.body;

    const slug = await generateUniqueSlug(title);

    // Process image: upload pasted URL to Cloudinary if needed
    const imageInfo = await processCoverImage(coverImage, coverImagePublicId);

    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      coverImage: imageInfo.coverImage,
      coverImagePublicId: imageInfo.coverImagePublicId,
      category,
      tags: tags || [],
      status: status || "draft",
      author: req.user._id,
      authorName: authorName.trim(),
      readTime: calculateReadTime(content),
    });

    await blog.populate("author", "name email");

    res.status(201).json({
      success: true,
      message: "Blog created successfully.",
      blog,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/blogs/:id
// Administrator: update a blog.
async function updateBlog(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    const oldPublicId = blog.coverImagePublicId;

    const allowedFields = [
      "title",
      "excerpt",
      "content",
      "category",
      "tags",
      "status",
      "authorName",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        blog[field] =
          field === "authorName" && typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    if (req.body.coverImage !== undefined) {
      const imageInfo = await processCoverImage(
        req.body.coverImage,
        req.body.coverImagePublicId
      );
      blog.coverImage = imageInfo.coverImage;
      blog.coverImagePublicId = imageInfo.coverImagePublicId;
    }

    if (req.body.title !== undefined) {
      blog.slug = await generateUniqueSlug(blog.title, blog._id);
    }

    if (req.body.content !== undefined) {
      blog.readTime = calculateReadTime(blog.content);
    }

    await blog.save();

    // Clean up old Cloudinary image if replaced and not referenced elsewhere
    if (
      oldPublicId &&
      oldPublicId !== blog.coverImagePublicId
    ) {
      const stillInUse = await Blog.exists({ coverImagePublicId: oldPublicId });
      if (!stillInUse) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.error("Failed to delete old image from Cloudinary:", err);
        }
      }
    }

    await blog.populate("author", "name email");

    res.status(200).json({
      success: true,
      message: "Blog updated successfully.",
      blog,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/blogs/:id/publish
// Administrator: publish or return a blog to draft status.
async function setBlogStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const { status } = req.body;

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "draft" or "published".',
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    res.status(200).json({
      success: true,
      message:
        status === "published"
          ? "Blog published successfully."
          : "Blog moved to drafts successfully.",
      blog,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/blogs/:id
// Administrator: permanently delete a blog and remove its Cloudinary image.
async function deleteBlog(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    // Delete image from Cloudinary if public ID exists and no other blog uses it
    if (blog.coverImagePublicId) {
      const stillInUse = await Blog.exists({ coverImagePublicId: blog.coverImagePublicId });
      if (!stillInUse) {
        try {
          await cloudinary.uploader.destroy(blog.coverImagePublicId);
        } catch (cloudinaryErr) {
          console.error("Failed to delete image from Cloudinary:", cloudinaryErr);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublishedBlogs,
  getAllBlogsForAdmin,
  getBlogBySlug,
  createBlog,
  updateBlog,
  setBlogStatus,
  deleteBlog,
};