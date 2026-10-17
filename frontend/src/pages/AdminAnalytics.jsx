
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiRefreshCw,
  FiEye,
  FiHeart,
  FiStar,
  FiMessageSquare,
  FiBookmark,
} from "react-icons/fi";
import api from "../api/axios";

function Metric({ icon, label, value }) {
  return (
    <div className="admin-stat h-100">
      <span className="admin-stat-icon">{icon}</span>
      <span className="admin-stat-label">{label}</span>
      <strong>{Number(value || 0).toLocaleString()}</strong>
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/engagement/admin/analytics");
      setData(response.data.analytics || response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load analytics. Check that the analytics endpoint is installed."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <section className="container section-spacing">
        <p>Loading platform analytics...</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="container py-5">
        <div className="admin-heading">
          <div>
            <p className="admin-eyebrow">INKWELL / INSIGHTS</p>
            <h1>Engagement analytics</h1>
            <p className="text-secondary mb-0">
              Review how readers interact with your articles.
            </p>
          </div>

          <button
            className="btn btn-outline-secondary"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <FiRefreshCw className="me-2" />
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-danger mt-4">{error}</div>}

        {data && (
          <>
            <div className="row g-3 my-4">
              <div className="col-6 col-lg-4">
                <Metric icon={<FiEye />} label="Article views" value={data.totalViews} />
              </div>
              <div className="col-6 col-lg-4">
                <Metric icon={<FiHeart />} label="Likes" value={data.totalLikes} />
              </div>
              <div className="col-6 col-lg-4">
                <Metric icon={<FiStar />} label="Ratings submitted" value={data.totalRatings} />
              </div>
              <div className="col-6 col-lg-4">
                <Metric icon={<FiMessageSquare />} label="Pending comments" value={data.pendingComments} />
              </div>
              <div className="col-6 col-lg-4">
                <Metric icon={<FiMessageSquare />} label="Approved comments" value={data.approvedComments} />
              </div>
              <div className="col-6 col-lg-4">
                <Metric icon={<FiBookmark />} label="Bookmarks" value={data.totalBookmarks} />
              </div>
            </div>

            <div className="admin-table-wrap mb-4">
              <div className="p-4">
                <h2 className="h4">Engagement overview</h2>
                <div className="row g-3 mt-1">
                  <div className="col-md-4">
                    <p className="text-secondary mb-1">Dislikes</p>
                    <h3>{Number(data.totalDislikes || 0).toLocaleString()}</h3>
                  </div>
                  <div className="col-md-4">
                    <p className="text-secondary mb-1">Average rating</p>
                    <h3>
                      {Number(data.averageRating || 0).toFixed(2)} / 5
                    </h3>
                  </div>
                  <div className="col-md-4">
                    <p className="text-secondary mb-1">Rejected comments</p>
                    <h3>
                      {Number(data.rejectedComments || 0).toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-table-wrap">
              <div className="p-4">
                <h2 className="h4 mb-3">Most-viewed articles</h2>

                {!data.mostViewed?.length ? (
                  <p className="text-secondary mb-0">
                    No article view data available yet.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Article</th>
                          <th>Category</th>
                          <th>Views</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {data.mostViewed.map((blog) => (
                          <tr key={blog._id}>
                            <td>{blog.title}</td>
                            <td>{blog.category}</td>
                            <td>{Number(blog.views || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
