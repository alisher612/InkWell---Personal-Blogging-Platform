
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBookmark, FiTrash2, FiRefreshCw } from "react-icons/fi";
import api from "../api/axios";

export default function SavedBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSavedBlogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/engagement/bookmarks/me");
      setBlogs(response.data.bookmarks || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load saved articles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedBlogs();
  }, [loadSavedBlogs]);

  async function removeBookmark(blogId) {
    try {
      await api.delete(`/engagement/${blogId}/bookmark`);
      setBlogs((current) =>
        current.filter((item) => {
          const blog = item.blog || item;
          return blog._id !== blogId;
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not remove the bookmark."
      );
    }
  }

  return (
    <section className="container section-spacing">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="admin-eyebrow">YOUR LIBRARY</p>
          <h1>Saved articles</h1>
          <p className="text-secondary mb-0">
            Stories you want to return to.
          </p>
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={loadSavedBlogs}
          disabled={loading}
        >
          <FiRefreshCw className="me-2" />
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading saved articles...</p>
      ) : blogs.length === 0 ? (
        <div className="empty-state">
          <FiBookmark size={34} />
          <h2>No saved articles yet</h2>
          <p>Bookmark an article and it will appear here.</p>
          <Link to="/blogs" className="btn btn-ink rounded-pill px-4">
            Explore articles
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {blogs.map((item) => {
            const blog = item.blog || item;

            if (!blog?._id) return null;

            return (
              <div className="col-12 col-md-6 col-xl-4" key={blog._id}>
                <article className="card h-100 border-0 shadow-sm">
                  {blog.coverImage && (
                    <img
                      src={blog.coverImage}
                      alt=""
                      className="card-img-top"
                      style={{ height: 210, objectFit: "cover" }}
                    />
                  )}

                  <div className="card-body d-flex flex-column">
                    <span className="text-secondary small mb-2">
                      {blog.category}
                    </span>
                    <h2 className="h5">{blog.title}</h2>
                    <p className="text-secondary">{blog.excerpt}</p>

                    <div className="d-flex gap-2 mt-auto">
                      <Link
                        to={`/blogs/${encodeURIComponent(blog.slug)}`}
                        className="btn btn-dark"
                      >
                        Read article
                      </Link>

                      <button
                        className="btn btn-outline-danger"
                        onClick={() => removeBookmark(blog._id)}
                        title="Remove bookmark"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
