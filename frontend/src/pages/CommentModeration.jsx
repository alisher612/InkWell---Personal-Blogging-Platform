
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheck,
  FiX,
  FiTrash2,
  FiRefreshCw,
  FiMessageSquare,
} from "react-icons/fi";
import api from "../api/axios";

const FILTERS = ["all", "pending", "approved", "rejected"];

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong."
  );
}

export default function CommentModeration() {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/engagement/admin/comments");
      setComments(response.data.comments || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const visibleComments =
    filter === "all"
      ? comments
      : comments.filter((comment) => comment.status === filter);

  async function updateStatus(comment, status) {
    setError("");
    setNotice("");

    try {
      await api.patch(`/engagement/admin/comments/${comment._id}`, {
        status,
      });

      setComments((current) =>
        current.map((item) =>
          item._id === comment._id ? { ...item, status } : item
        )
      );

      setNotice(`Comment marked ${status}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteComment(comment) {
    if (!window.confirm("Permanently delete this comment?")) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/engagement/admin/comments/${comment._id}`);
      setComments((current) =>
        current.filter((item) => item._id !== comment._id)
      );
      setNotice("Comment deleted.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className="admin-page">
      <div className="container py-5">
        <div className="admin-heading">
          <div>
            <p className="admin-eyebrow">INKWELL / COMMUNITY</p>
            <h1>Comment moderation</h1>
            <p className="text-secondary mb-0">
              Review comments before they appear publicly.
            </p>
          </div>

          <button
            className="btn btn-outline-secondary"
            onClick={loadComments}
            disabled={loading}
          >
            <FiRefreshCw className="me-2" />
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-danger mt-4">{error}</div>}
        {notice && <div className="alert alert-success mt-4">{notice}</div>}

        <div className="d-flex flex-wrap gap-2 my-4">
          {FILTERS.map((status) => (
            <button
              key={status}
              className={`btn ${
                filter === status
                  ? "btn-dark"
                  : "btn-outline-secondary"
              }`}
              onClick={() => setFilter(status)}
            >
              {status[0].toUpperCase() + status.slice(1)}
              {status !== "all" && (
                <span className="ms-2">
                  {comments.filter((comment) => comment.status === status).length}
                </span>
              )}
              {status === "all" && (
                <span className="ms-2">{comments.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading comments...</p>
        ) : visibleComments.length === 0 ? (
          <div className="admin-empty">
            <FiMessageSquare size={32} />
            <h2>No comments found</h2>
            <p>There are no comments matching this filter.</p>
          </div>
        ) : (
          <div className="moderation-list">
            {visibleComments.map((comment) => {
              const blog = comment.blog || {};
              const author = comment.user || {};

              return (
                <article className="moderation-card" key={comment._id}>
                  <div className="d-flex flex-wrap justify-content-between gap-3">
                    <div>
                      <span
                        className={`admin-status ${
                          comment.status === "approved"
                            ? "is-published"
                            : comment.status === "rejected"
                              ? "is-rejected"
                              : "is-draft"
                        }`}
                      >
                        {comment.status}
                      </span>

                      <h2 className="h5 mt-3 mb-1">
                        {author.name || "Unknown reader"}
                      </h2>

                      <p className="text-secondary small mb-0">
                        {author.email || "No email available"}
                        {comment.createdAt &&
                          ` · ${new Date(comment.createdAt).toLocaleString()}`}
                      </p>
                    </div>

                    {blog.title && (
                      <div className="moderation-blog-title">
                        <span className="text-secondary small">
                          Article
                        </span>
                        <p className="mb-1 fw-semibold">{blog.title}</p>

                        {blog.status === "published" && blog.slug && (
                          <Link
                            to={`/blogs/${encodeURIComponent(blog.slug)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="small"
                          >
                            View article
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="moderation-content mt-3 mb-4">
                    {comment.content}
                  </p>

                  <div className="d-flex flex-wrap gap-2">
                    {comment.status !== "approved" && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => updateStatus(comment, "approved")}
                      >
                        <FiCheck className="me-1" />
                        Approve
                      </button>
                    )}

                    {comment.status !== "rejected" && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => updateStatus(comment, "rejected")}
                      >
                        <FiX className="me-1" />
                        Reject
                      </button>
                    )}

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteComment(comment)}
                    >
                      <FiTrash2 className="me-1" />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
