
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiClock, FiSearch } from "react-icons/fi";
import api from "../api/axios";

function Blogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const searchTerm = searchParams.get("search") || "";

  useEffect(() => {
    let active = true;

    async function loadBlogs() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/blogs", {
          params: { page, limit: 9, search: searchTerm || undefined },
        });

        if (!active) return;

        setBlogs(response.data.blogs || []);
        setPagination(response.data.pagination);
      } catch {
        if (active) {
          setError("Unable to load articles. Check that the backend is running.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBlogs();

    return () => {
      active = false;
    };
  }, [page, searchTerm]);

  function handleSearch(event) {
    event.preventDefault();

    const next = {};
    if (search.trim()) next.search = search.trim();

    setSearchParams(next);
  }

  function changePage(nextPage) {
    const next = {};

    if (searchTerm) next.search = searchTerm;
    if (nextPage > 1) next.page = String(nextPage);

    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="section-spacing min-vh-100">
      <div className="container">
        <div className="page-intro">
          <span className="eyebrow">THE INKWELL LIBRARY</span>
          <h1>Explore stories.</h1>
          <p>Find useful ideas, fresh perspectives, and something new to learn.</p>
        </div>

        <form className="search-bar" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="search"
            className="form-control"
            placeholder="Search articles by title or keyword..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search articles"
          />
          <button className="btn btn-ink rounded-pill px-4" type="submit">
            Search
          </button>
        </form>

        {searchTerm && (
          <div className="search-context">
            Results for <strong>"{searchTerm}"</strong>
            <button
              className="btn btn-sm btn-link text-dark"
              onClick={() => {
                setSearch("");
                setSearchParams({});
              }}
              type="button"
            >
              Clear search
            </button>
          </div>
        )}

        {loading && <p className="status-message">Loading articles...</p>}

        {!loading && error && (
          <div className="alert alert-light border">{error}</div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="empty-state">
            <FiSearch size={28} />
            <h3>No stories found</h3>
            <p>Try another search term, or check back when more articles are published.</p>
          </div>
        )}

        {!loading && !error && blogs.length > 0 && (
          <>
            <div className="results-count">
              {pagination.total} {pagination.total === 1 ? "article" : "articles"} available
            </div>

            <div className="row g-4">
              {blogs.map((blog) => (
                <div className="col-md-6 col-lg-4" key={blog._id}>
                  <article className="blog-card h-100">
                    {blog.coverImage ? (
                      <img
                        className="blog-cover"
                        src={blog.coverImage}
                        alt={blog.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="blog-cover blog-cover-placeholder">
                        <span>INKWELL</span>
                      </div>
                    )}

                    <div className="blog-card-body">
                      <span className="category-label">{blog.category}</span>
                      <h2>{blog.title}</h2>
                      <p>{blog.excerpt}</p>

                      <div className="blog-card-meta">
                        <span className="d-inline-flex align-items-center gap-2">
                          <span className="badge text-uppercase bg-secondary-subtle text-secondary-emphasis rounded-1 px-2 py-1 fw-bold fs-7">
                            Author
                          </span>
                          <strong className="text-dark fw-bold fs-6 tracking-wide">
                            {blog.authorName || blog.author?.name || "InkWell Editorial"}
                          </strong>
                        </span>
                        <span><FiClock /> {blog.readTime || 1} min</span>
                      </div>

                      <Link to={`/blogs/${blog.slug}`} className="text-link mt-3">
                        Read article <FiArrowRight />
                      </Link>
                    </div>
                  </article>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <nav className="pagination-wrap" aria-label="Blog pagination">
                <button
                  className="btn btn-outline-dark rounded-pill"
                  disabled={page <= 1}
                  onClick={() => changePage(page - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {pagination.totalPages}
                </span>

                <button
                  className="btn btn-outline-dark rounded-pill"
                  disabled={page >= pagination.totalPages}
                  onClick={() => changePage(page + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default Blogs;
