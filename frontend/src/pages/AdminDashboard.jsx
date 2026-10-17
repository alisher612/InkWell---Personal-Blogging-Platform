import { useCallback, useEffect, useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiEye,
  FiSend,
  FiArchive,
  FiRefreshCw,
  FiX,
  FiUploadCloud,
  FiMessageSquare,
  FiBarChart2,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../api/axios";

const EMPTY_FORM = {
  title: "",
  authorName: "",
  excerpt: "",
  content: "",
  category: "",
  coverImage: "",
  coverImagePublicId: "",
  tags: "",
  status: "draft",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function getErrorMessage(error) {
  return (
    error.response?.data?.errors?.[0]?.msg ||
    error.response?.data?.message ||
    error.message ||
    "Something went wrong."
  );
}

export default function AdminDashboard() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Pending comment moderation badge.
  const [pendingCommentCount, setPendingCommentCount] = useState(0);

  // Load all articles for the admin dashboard.
  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/blogs/admin/all");
      setBlogs(response.data.blogs || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load comments and calculate the pending moderation count.
  const loadPendingCommentCount = useCallback(async () => {
    try {
      const response = await api.get("/engagement/admin/comments");
      const comments = response.data.comments || [];

      const pendingCount = comments.filter(
        (comment) => comment.status === "pending"
      ).length;

      setPendingCommentCount(pendingCount);
    } catch (err) {
      // Keep the dashboard usable if comment statistics cannot load.
      console.error("Failed to load pending comment count:", err);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  useEffect(() => {
    loadPendingCommentCount();

    const intervalId = window.setInterval(() => {
      loadPendingCommentCount();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadPendingCommentCount]);

  // Create one preview URL per selected image and clean it up.
  useEffect(() => {
    if (!selectedImage) {
      setSelectedImagePreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setSelectedImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  const publishedCount = blogs.filter(
    (blog) => blog.status === "published"
  ).length;

  const draftCount = blogs.filter(
    (blog) => blog.status === "draft"
  ).length;

  const totalViews = blogs.reduce(
    (total, blog) => total + (blog.views || 0),
    0
  );

  const previewUrl = selectedImagePreview || form.coverImage;

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setSelectedImage(null);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(blog) {
    setEditingId(blog._id);

    setForm({
      title: blog.title || "",
      authorName: blog.authorName || blog.author?.name || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      category: blog.category || "",
      coverImage: blog.coverImage || "",
      coverImagePublicId: blog.coverImagePublicId || "",
      tags: (blog.tags || []).join(", "),
      status: blog.status || "draft",
    });

    setSelectedImage(null);
    setError("");
    setNotice("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setSelectedImage(null);
    setSelectedImagePreview("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleImageSelection(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, WEBP, or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("The image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setNotice("");
    setSelectedImage(file);
  }

  async function uploadSelectedImage() {
    // A pasted URL, or no cover image, needs no file upload.
    if (!selectedImage) {
      return {
        coverImage: form.coverImage.trim(),
        coverImagePublicId: form.coverImagePublicId,
      };
    }

    const imageData = new FormData();
    imageData.append("image", selectedImage);

    setUploading(true);

    try {
      const response = await api.post(
        "/uploads/image",
        imageData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageUrl = response.data?.imageUrl;
      const publicId = response.data?.publicId || "";

      if (typeof imageUrl !== "string" || !imageUrl.trim()) {
        throw new Error(
          "The image upload endpoint did not return an imageUrl. Check the backend upload route."
        );
      }

      const cleanImageUrl = imageUrl.trim();

      setForm((current) => ({
        ...current,
        coverImage: cleanImageUrl,
        coverImagePublicId: publicId,
      }));

      setSelectedImage(null);

      return {
        coverImage: cleanImageUrl,
        coverImagePublicId: publicId,
      };
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || uploading) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      // Upload the selected file first, if there is one.
      // Otherwise use the pasted image URL/publicId from the form.
      const imageResult = await uploadSelectedImage();

      const payload = {
        ...form,
        title: form.title.trim(),
        authorName: form.authorName.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        category: form.category.trim(),
        coverImage: imageResult.coverImage,
        coverImagePublicId: imageResult.coverImagePublicId,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await api.patch(`/blogs/${editingId}`, payload);

        setNotice("Article updated successfully.");
      } else {
        await api.post("/blogs", payload);

        setNotice(
          payload.status === "published"
            ? "Article created and published."
            : "Draft created successfully."
        );
      }

      closeForm();
      await loadBlogs();
      await loadPendingCommentCount();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function changeStatus(blog) {
    const nextStatus =
      blog.status === "published" ? "draft" : "published";

    const confirmed = window.confirm(
      nextStatus === "published"
        ? `Publish "${blog.title}"?`
        : `Move "${blog.title}" back to drafts?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.patch(`/blogs/${blog._id}/publish`, {
        status: nextStatus,
      });

      setNotice(
        nextStatus === "published"
          ? "Article published successfully."
          : "Article moved to drafts."
      );

      await loadBlogs();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteBlog(blog) {
    const confirmed = window.confirm(
      `Permanently delete "${blog.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/blogs/${blog._id}`);

      setNotice("Article deleted successfully.");

      await loadBlogs();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function removeCoverImage() {
    setSelectedImage(null);
    setSelectedImagePreview("");

    setForm((current) => ({
      ...current,
      coverImage: "",
      coverImagePublicId: "",
    }));

    const fileInput = document.getElementById("coverImageFile");

    if (fileInput) {
      fileInput.value = "";
    }
  }

  return (
    <section className="admin-page">
      <div className="container py-5">
        <header className="admin-heading">
          <div>
            <p className="admin-eyebrow">
              INKWELL / CONTROL CENTER
            </p>

            <h1>Admin dashboard</h1>

            <p className="text-secondary mb-0">
              Publish articles, manage drafts, moderate discussions,
              and review platform performance.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Link
              to="/admin/comments"
              className="btn btn-outline-secondary d-inline-flex align-items-center"
            >
              <FiMessageSquare className="me-2" />
              Comments

              <span
                className={`badge rounded-pill ms-2 ${
                  pendingCommentCount > 0
                    ? "text-bg-danger"
                    : "text-bg-secondary"
                }`}
                aria-label={`${pendingCommentCount} pending comments`}
                title="Pending comments awaiting moderation"
              >
                {pendingCommentCount}
              </span>
            </Link>

            <Link
              to="/admin/analytics"
              className="btn btn-outline-secondary"
            >
              <FiBarChart2 className="me-2" />
              Analytics
            </Link>

            <button
              className="btn admin-primary-btn"
              onClick={openCreateForm}
              type="button"
            >
              <FiPlus className="me-2" />
              New article
            </button>
          </div>
        </header>

        {error && (
          <div className="alert alert-danger mt-4" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="alert alert-success mt-4" role="status">
            {notice}
          </div>
        )}

        <div className="row g-3 my-4">
          {[
            {
              label: "Total articles",
              value: blogs.length,
              icon: <FiFileText />,
            },
            {
              label: "Published",
              value: publishedCount,
              icon: <FiSend />,
            },
            {
              label: "Drafts",
              value: draftCount,
              icon: <FiArchive />,
            },
            {
              label: "Total views",
              value: totalViews.toLocaleString(),
              icon: <FiEye />,
            },
          ].map((stat) => (
            <div className="col-6 col-lg-3" key={stat.label}>
              <div className="admin-stat h-100">
                <span className="admin-stat-icon">
                  {stat.icon}
                </span>

                <span className="admin-stat-label">
                  {stat.label}
                </span>

                <strong>{stat.value}</strong>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <section
            className="admin-editor mb-5"
            id="article-editor"
          >
            <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
              <div>
                <p className="admin-eyebrow mb-1">
                  {editingId ? "EDIT ARTICLE" : "NEW ARTICLE"}
                </p>

                <h2 className="h3 mb-1">
                  {editingId
                    ? "Update your story"
                    : "Create a story"}
                </h2>

                <p className="text-secondary mb-0">
                  Complete the article details below. Fields marked
                  with * are required.
                </p>
              </div>

              <button
                className="btn btn-light"
                type="button"
                onClick={closeForm}
                aria-label="Close editor"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-12 col-lg-8">
                  <div className="admin-form-panel h-100">
                    <h3 className="h5 mb-3">
                      Article details
                    </h3>

                    <div className="mb-3">
                      <label
                        className="form-label"
                        htmlFor="title"
                      >
                        Article title *
                      </label>

                      <input
                        className="form-control"
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        minLength={5}
                        maxLength={160}
                        placeholder="Give your article a clear title"
                        required
                      />

                      <div className="form-text">
                        {form.title.length}/160 characters
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="authorName">
                        Author Name *
                      </label>

                      <input
                        className="form-control"
                        id="authorName"
                        name="authorName"
                        type="text"
                        value={form.authorName}
                        onChange={handleChange}
                        maxLength={80}
                        placeholder="Enter the author's name"
                        required
                      />

                      <div className="form-text">
                        This name will appear publicly on the article.
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label
                          className="form-label"
                          htmlFor="category"
                        >
                          Category *
                        </label>

                        <input
                          className="form-control"
                          id="category"
                          name="category"
                          value={form.category}
                          onChange={handleChange}
                          maxLength={60}
                          placeholder="Technology"
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label
                          className="form-label"
                          htmlFor="status"
                        >
                          Publication status
                        </label>

                        <select
                          className="form-select"
                          id="status"
                          name="status"
                          value={form.status}
                          onChange={handleChange}
                        >
                          <option value="draft">
                            Save as draft
                          </option>

                          <option value="published">
                            Publish article
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label
                        className="form-label"
                        htmlFor="excerpt"
                      >
                        Short excerpt *
                      </label>

                      <textarea
                        className="form-control"
                        id="excerpt"
                        name="excerpt"
                        rows={3}
                        maxLength={300}
                        value={form.excerpt}
                        onChange={handleChange}
                        placeholder="Summarize the article for readers..."
                        required
                      />

                      <div className="form-text">
                        {form.excerpt.length}/300 characters
                      </div>
                    </div>

                    <div className="mt-3">
                      <label
                        className="form-label"
                        htmlFor="content"
                      >
                        Article content *
                      </label>

                      <textarea
                        className="form-control admin-content-input"
                        id="content"
                        name="content"
                        rows={15}
                        minLength={50}
                        value={form.content}
                        onChange={handleChange}
                        placeholder="Write your article here. Separate paragraphs with blank lines."
                        required
                      />

                      <div className="form-text">
                        At least 50 characters. Separate paragraphs
                        with blank lines.
                      </div>
                    </div>

                    <div className="mt-3">
                      <label
                        className="form-label"
                        htmlFor="tags"
                      >
                        Tags
                      </label>

                      <input
                        className="form-control"
                        id="tags"
                        name="tags"
                        value={form.tags}
                        onChange={handleChange}
                        placeholder="javascript, web development, tutorials"
                      />

                      <div className="form-text">
                        Separate tags with commas.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div className="admin-form-panel h-100">
                    <h3 className="h5 mb-1">
                      Cover image
                    </h3>

                    <p className="text-secondary small mb-3">
                      Upload a local image or paste an existing
                      image URL. Maximum file size: 5 MB.
                    </p>

                    <label
                      htmlFor="coverImageFile"
                      className="admin-upload-zone"
                    >
                      <FiUploadCloud size={30} />
                      <strong>Choose an image</strong>
                      <span>JPG, PNG, WEBP or GIF</span>
                    </label>

                    <input
                      className="form-control mt-2"
                      id="coverImageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageSelection}
                    />

                    {selectedImage && (
                      <p className="small mt-2 mb-0 text-secondary">
                        Selected: {selectedImage.name}
                      </p>
                    )}

                    <div className="mt-4">
                      <label
                        className="form-label"
                        htmlFor="coverImage"
                      >
                        Or image URL
                      </label>

                      <input
                        className="form-control"
                        id="coverImage"
                        name="coverImage"
                        type="url"
                        maxLength={1000}
                        value={form.coverImage}
                        onChange={(event) => {
                          setSelectedImage(null);
                          setError("");
                          // Clear out public ID when typing/pasting a new manual URL so backend handles it
                          setForm((current) => ({
                            ...current,
                            coverImage: event.target.value,
                            coverImagePublicId: "",
                          }));
                        }}
                        placeholder="https://example.com/image.jpg"
                      />

                      <div className="form-text">
                        Paste a complete URL beginning with https://
                        or http://.
                      </div>
                    </div>

                    {previewUrl && (
                      <div className="admin-image-preview mt-3">
                        <img
                          src={previewUrl}
                          alt="Article cover preview"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                          onLoad={(event) => {
                            event.currentTarget.style.display = "block";
                          }}
                        />

                        <button
                          type="button"
                          className="btn btn-sm btn-light mt-2"
                          onClick={removeCoverImage}
                        >
                          <FiX className="me-1" />
                          Remove image
                        </button>
                      </div>
                    )}

                    <div className="admin-publish-note mt-4">
                      <strong>Before publishing</strong>

                      <p className="small mb-0 mt-1">
                        Check the title, excerpt, content, category,
                        and cover image. You can save as a draft and
                        publish later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button
                  className="btn admin-primary-btn"
                  type="submit"
                  disabled={saving || uploading}
                >
                  {uploading
                    ? "Uploading image..."
                    : saving
                      ? "Saving article..."
                      : editingId
                        ? "Save changes"
                        : form.status === "published"
                          ? "Create and publish"
                          : "Save draft"}
                </button>

                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={closeForm}
                  disabled={saving || uploading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="admin-list-heading">
          <div>
            <h2>All articles</h2>

            <p className="text-secondary mb-0">
              Manage published stories and unpublished drafts.
            </p>
          </div>

          <button
            className="btn btn-outline-secondary"
            onClick={loadBlogs}
            disabled={loading}
            type="button"
          >
            <FiRefreshCw className="me-2" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

            <p className="mt-3">
              Loading your articles...
            </p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="admin-empty">
            <FiFileText size={34} />

            <h3>No articles yet</h3>

            <p>Create your first article to get started.</p>

            <button
              className="btn admin-primary-btn"
              onClick={openCreateForm}
              type="button"
            >
              <FiPlus className="me-2" />
              Create first article
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <div className="table-responsive">
              <table className="table admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Updated</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {blogs.map((blog) => (
                    <tr key={blog._id}>
                      <td>
                        <div className="admin-article-title">
                          {blog.title}
                        </div>

                        <div className="admin-article-meta">
                          {blog.category} · {blog.readTime || 1} min read
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-status ${
                            blog.status === "published"
                              ? "is-published"
                              : "is-draft"
                          }`}
                        >
                          {blog.status}
                        </span>
                      </td>

                      <td>
                        {(blog.views || 0).toLocaleString()}
                      </td>

                      <td>
                        {blog.updatedAt
                          ? new Date(
                              blog.updatedAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <div className="admin-actions">
                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => openEditForm(blog)}
                            title="Edit article"
                            type="button"
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => changeStatus(blog)}
                            title={
                              blog.status === "published"
                                ? "Move to drafts"
                                : "Publish article"
                            }
                            type="button"
                          >
                            {blog.status === "published" ? (
                              <FiArchive />
                            ) : (
                              <FiSend />
                            )}
                          </button>

                          <button
                            className="btn btn-sm btn-light text-danger"
                            onClick={() => deleteBlog(blog)}
                            title="Delete article"
                            type="button"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}