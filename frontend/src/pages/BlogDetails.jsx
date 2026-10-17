
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiClock,
  FiArrowRight,
  FiBookOpen,
} from "react-icons/fi";

import api from "../api/axios";
import BlogEngagement from "../components/BlogEngagement";

function BlogDetails() {
  const { slug } = useParams();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBlog() {
      setLoading(true);
      setError("");
      setBlog(null);

      try {
        const response = await api.get(
          `/blogs/${encodeURIComponent(slug)}`
        );

        if (active) {
          setBlog(response.data.blog);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.status === 404
              ? "This article does not exist or is no longer published."
              : "Unable to load this article. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBlog();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container section-spacing status-message">
        Loading article...
      </div>
    );
  }

  if (error || !blog) {
    return (
      <section className="container section-spacing">
        <div className="empty-state">
          <h2>Article unavailable</h2>
          <p>{error || "We couldn't find this article."}</p>

          <Link
            to="/blogs"
            className="btn btn-ink rounded-pill px-4"
          >
            Browse articles
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article className="article-page">
      <div className="container article-container">
        <Link to="/blogs" className="back-link">
          <FiArrowLeft />
          <span>Back to all stories</span>
        </Link>

        <header className="article-header">
          <span className="category-label">{blog.category}</span>

          <h1>{blog.title}</h1>

          <p className="article-excerpt">{blog.excerpt}</p>

          <div className="article-meta d-flex align-items-center flex-nowrap gap-3">
            <span className="d-inline-flex align-items-center gap-2 flex-shrink-0">
              <span className="badge text-uppercase bg-secondary-subtle text-secondary-emphasis rounded-1 px-2 py-1 fw-bold fs-7">
                Author
              </span>
              <strong className="text-dark fw-bold fs-6 tracking-wide">
                {blog.authorName || blog.author?.name || "InkWell Editorial"}
              </strong>
            </span>

            <span className="flex-shrink-0">
              <FiClock />
              {blog.readTime || 1} min read
            </span>

            {blog.createdAt && (
              <time className="flex-shrink-0" dateTime={blog.createdAt}>
                {new Date(blog.createdAt).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </time>
            )}
          </div>
        </header>

        {blog.coverImage && (
          <img
            className="article-cover"
            src={blog.coverImage}
            alt={blog.title}
          />
        )}

        <div className="article-content">{blog.content}</div>

        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
          <div className="article-tags">
            <strong>Tags:</strong>

            {blog.tags.map((tag) => (
              <span className="tag-chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Reader engagement */}
        <BlogEngagement blogId={blog._id} />

        {/* Modern article footer */}
        <footer className="article-end-card">
          <div className="article-end-content">
            <span className="article-end-icon">
              <FiBookOpen />
            </span>

            <div className="article-end-copy">
              <span className="article-end-eyebrow">
                KEEP EXPLORING
              </span>

              <h2>One story leads to another.</h2>

              <p>
                Discover more perspectives, useful ideas, and stories
                worth your time from the InkWell community.
              </p>
            </div>
          </div>

          <div className="article-end-action">
            <Link to="/blogs" className="article-end-button">
              Explore more stories
              <FiArrowRight />
            </Link>
          </div>
        </footer>

        <div className="article-bottom-link">
          <Link to="/blogs" className="back-link">
            <FiArrowLeft />
            Return to all stories
          </Link>
        </div>
      </div>
    </article>
  );
}

export default BlogDetails;
