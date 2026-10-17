
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiBookmark,
  FiHeart,
  FiStar,
  FiMessageCircle,
  FiThumbsDown,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiX,
  FiSend,
} from "react-icons/fi";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function BlogEngagement({ blogId }) {
  const { isAuthenticated } = useAuth();

  const [summary, setSummary] = useState({
    likes: 0,
    dislikes: 0,
    averageRating: 0,
    ratingCount: 0,
    approvedComments: 0,
  });

  const [comments, setComments] = useState([]);
  const [myReaction, setMyReaction] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null);

  const nextFlashId = useRef(0);

  // A unique ID ensures identical consecutive messages are displayed again.
  const showFlash = useCallback((message, type = "info") => {
    setFlash({
      id: ++nextFlashId.current,
      message,
      type,
    });
  }, []);

  const clearFlash = useCallback(() => {
    setFlash(null);
  }, []);

  // Every notification automatically disappears after 10 seconds.
  useEffect(() => {
    if (!flash) return undefined;

    const timer = window.setTimeout(() => {
      setFlash(null);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [flash]);

  const loadPublicData = useCallback(async () => {
    if (!blogId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [summaryResponse, commentsResponse] = await Promise.all([
        api.get(`/engagement/${blogId}/summary`),
        api.get(`/engagement/${blogId}/comments`),
      ]);

      setSummary(
        summaryResponse.data.summary || summaryResponse.data
      );

      setComments(commentsResponse.data.comments || []);
    } catch (err) {
      showFlash(
        err.response?.data?.message ||
          "Could not load article engagement.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [blogId, showFlash]);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  async function reactToArticle(type) {
    if (!isAuthenticated) {
      showFlash("Please log in to react to this article.", "error");
      return;
    }

    clearFlash();
    setBusy(true);

    try {
      if (myReaction === type) {
        await api.delete(`/engagement/${blogId}/reaction`);
        setMyReaction(null);
        showFlash("Your reaction has been removed.", "success");
      } else {
        await api.post(`/engagement/${blogId}/reaction`, { type });
        setMyReaction(type);
        showFlash("Your reaction has been saved.", "success");
      }

      await loadPublicData();
    } catch (err) {
      showFlash(
        err.response?.data?.message || "Could not save your reaction.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  async function rateArticle(value) {
    if (!isAuthenticated) {
      showFlash("Please log in to rate this article.", "error");
      return;
    }

    clearFlash();
    setBusy(true);

    try {
      await api.put(`/engagement/${blogId}/rating`, { value });
      setMyRating(value);
      showFlash("Your rating was saved successfully.", "success");

      await loadPublicData();
    } catch (err) {
      showFlash(
        err.response?.data?.message || "Could not save your rating.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleBookmark() {
    if (!isAuthenticated) {
      showFlash("Please log in to bookmark this article.", "error");
      return;
    }

    clearFlash();
    setBusy(true);

    try {
      if (bookmarked) {
        await api.delete(`/engagement/${blogId}/bookmark`);
        setBookmarked(false);
        showFlash("Article removed from your reading list.", "success");
      } else {
        await api.put(`/engagement/${blogId}/bookmark`);
        setBookmarked(true);
        showFlash("Article saved to your reading list.", "success");
      }
    } catch (err) {
      showFlash(
        err.response?.data?.message ||
          "Could not update your reading list.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      showFlash("Please log in to leave a comment.", "error");
      return;
    }

    if (!commentText.trim()) {
      showFlash("Please write a comment before submitting.", "error");
      return;
    }

    clearFlash();
    setBusy(true);

    try {
      await api.post(`/engagement/${blogId}/comments`, {
        content: commentText.trim(),
      });

      setCommentText("");
      showFlash(
        "Your comment was submitted and is awaiting moderation.",
        "success"
      );
    } catch (err) {
      showFlash(
        err.response?.data?.message || "Could not submit your comment.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  const FlashIcon =
    flash?.type === "success"
      ? FiCheckCircle
      : flash?.type === "error"
        ? FiAlertCircle
        : FiInfo;

  return (
    <section className="blog-engagement my-5">
      <div className="engagement-panel">
        <div className="engagement-heading">
          <div>
            <p className="engagement-eyebrow">JOIN THE CONVERSATION</p>
            <h2 className="engagement-title">What did you think?</h2>
            <p className="engagement-subtitle">
              Share your reaction and join the discussion.
            </p>
          </div>

          <button
            type="button"
            className={`engagement-bookmark ${
              bookmarked ? "is-bookmarked" : ""
            }`}
            onClick={toggleBookmark}
            disabled={busy}
            aria-pressed={bookmarked}
          >
            <FiBookmark size={17} />
            <span>{bookmarked ? "Saved" : "Save article"}</span>
          </button>
        </div>

        <div className="engagement-stats">
          <div className="engagement-stat">
            <span className="engagement-stat-icon">
              <FiHeart />
            </span>
            <div>
              <strong>{summary.likes ?? 0}</strong>
              <span>Likes</span>
            </div>
          </div>

          <div className="engagement-stat">
            <span className="engagement-stat-icon">
              <FiThumbsDown />
            </span>
            <div>
              <strong>{summary.dislikes ?? 0}</strong>
              <span>Dislikes</span>
            </div>
          </div>

          <div className="engagement-stat">
            <span className="engagement-stat-icon">
              <FiStar />
            </span>
            <div>
              <strong>
                {Number(summary.averageRating || 0).toFixed(1)}
                <span className="engagement-rating-max"> / 5</span>
              </strong>
              <span>{summary.ratingCount ?? 0} ratings</span>
            </div>
          </div>
        </div>

        <div className="engagement-actions">
          <button
            type="button"
            className={`engagement-action ${
              myReaction === "like" ? "is-active" : ""
            }`}
            onClick={() => reactToArticle("like")}
            disabled={busy}
            aria-pressed={myReaction === "like"}
          >
            <FiHeart />
            <span>{myReaction === "like" ? "Liked" : "Like"}</span>
          </button>

          <button
            type="button"
            className={`engagement-action ${
              myReaction === "dislike" ? "is-active" : ""
            }`}
            onClick={() => reactToArticle("dislike")}
            disabled={busy}
            aria-pressed={myReaction === "dislike"}
          >
            <FiThumbsDown />
            <span>
              {myReaction === "dislike" ? "Disliked" : "Dislike"}
            </span>
          </button>
        </div>

        <div className="engagement-rating">
          <div>
            <h3>Rate this article</h3>
            <p>Select a rating from 1 to 5 stars.</p>
          </div>

          <div
            className="engagement-rating-buttons"
            role="group"
            aria-label="Rate this article"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`engagement-star ${
                  myRating >= value ? "is-selected" : ""
                }`}
                aria-label={`Rate ${value} out of 5`}
                aria-pressed={myRating === value}
                onClick={() => rateArticle(value)}
                disabled={busy}
              >
                <FiStar />
                <span>{value}</span>
              </button>
            ))}
          </div>
        </div>

        {flash && (
          <div
            key={flash.id}
            className={`engagement-flash engagement-flash--${flash.type}`}
            role={flash.type === "error" ? "alert" : "status"}
            aria-live={flash.type === "error" ? "assertive" : "polite"}
          >
            <FlashIcon className="engagement-flash-icon" size={21} />

            <div className="engagement-flash-content">
              <strong>
                {flash.type === "success"
                  ? "Success"
                  : flash.type === "error"
                    ? "Action needed"
                    : "Notice"}
              </strong>
              <p>{flash.message}</p>
            </div>

            <button
              type="button"
              className="engagement-flash-close"
              aria-label="Dismiss notification"
              onClick={clearFlash}
            >
              <FiX size={19} />
            </button>

            <span className="engagement-flash-progress" />
          </div>
        )}

        <div className="engagement-comments">
          <div className="engagement-comments-heading">
            <span className="engagement-comments-icon">
              <FiMessageCircle size={21} />
            </span>
            <div>
              <h3>Reader comments</h3>
              <p>
                {summary.approvedComments ?? 0} approved comments
              </p>
            </div>
          </div>

          {isAuthenticated ? (
            <form onSubmit={submitComment} className="engagement-comment-form">
              <label htmlFor={`readerComment-${blogId}`}>
                Add to the conversation
              </label>

              <textarea
                id={`readerComment-${blogId}`}
                className="engagement-comment-input"
                rows={4}
                maxLength={2000}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Share a thoughtful response..."
                required
              />

              <div className="engagement-comment-footer">
                <span>
                  {commentText.length}/2000 characters · Comments are
                  reviewed before publication.
                </span>

                <button
                  type="submit"
                  className="engagement-submit"
                  disabled={busy || !commentText.trim()}
                >
                  <FiSend size={16} />
                  <span>{busy ? "Please wait..." : "Submit comment"}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="engagement-login-hint">
              <FiInfo size={18} />
              <p>
                Log in to react, rate, bookmark, or comment on this article.
              </p>
            </div>
          )}

          <div className="engagement-comment-list">
            {loading ? (
              <p className="engagement-empty">Loading comments...</p>
            ) : comments.length === 0 ? (
              <div className="engagement-empty">
                <FiMessageCircle size={25} />
                <p>No approved comments yet.</p>
                <span>Be the first to start the conversation.</span>
              </div>
            ) : (
              comments.map((comment) => (
                <article
                  className="engagement-comment"
                  key={comment._id}
                >
                  <div className="engagement-comment-avatar">
                    {(comment.user?.name || "R")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="engagement-comment-content">
                    <div className="engagement-comment-meta">
                      <strong>{comment.user?.name || "Reader"}</strong>
                      {comment.createdAt && (
                        <time dateTime={comment.createdAt}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </time>
                      )}
                    </div>

                    <p>{comment.content}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
