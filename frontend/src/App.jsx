
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { FiBookOpen, FiArrowUpRight, FiHeart } from "react-icons/fi";

import { AuthProvider } from "./context/AuthContext";
import GlobalAlertEnhancer from "./components/GlobalAlertEnhancer";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
import BlogDetails from "./pages/BlogDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/AdminDashboard";
import CommentModeration from "./pages/CommentModeration";
import AdminAnalytics from "./pages/AdminAnalytics";
import SavedBlogs from "./pages/SavedBlogs";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalAlertEnhancer />

        <div className="inkwell-app-shell">
          <Navbar />

          <main className="inkwell-main">
            <Routes>
              {/* Public pages */}
              <Route path="/" element={<Home />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:slug" element={<BlogDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Authenticated user pages */}
              <Route element={<ProtectedRoute />}>
                <Route path="/saved" element={<SavedBlogs />} />
              </Route>

              {/* Admin-only pages */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route
                  path="/admin/comments"
                  element={<CommentModeration />}
                />
                <Route
                  path="/admin/analytics"
                  element={<AdminAnalytics />}
                />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <footer className="inkwell-footer">
            <div className="container">
              <div className="inkwell-footer-main">
                <Link to="/" className="inkwell-footer-brand">
                  <span className="inkwell-footer-brand-icon">
                    <FiBookOpen size={21} />
                  </span>
                  <span>
                    Ink<span>Well</span>
                  </span>
                </Link>

                <p className="inkwell-footer-tagline">
                  A space for stories, ideas, and perspectives worth sharing.
                </p>

                <div className="inkwell-footer-links">
                  <Link to="/">Home</Link>
                  <Link to="/blogs">Explore Blogs</Link>
                </div>
              </div>

              <div className="inkwell-footer-bottom">
                <span className="inkwell-copyright">
                  © {new Date().getFullYear()} InkWell. All rights reserved.
                </span>

                <div className="inkwell-footer-credit">
                  <span className="inkwell-credit-made">
                    Crafted with <FiHeart size={13} /> by
                  </span>
                  <span className="inkwell-credit-author">Ali Sher</span>
                  <span className="inkwell-credit-role">
                    MERN &amp; AI Developer
                  </span>
                  <a
                    className="inkwell-credit-link"
                    href="https://linkedin.com/in/alisherdev"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Ali Sher on LinkedIn"
                    title="Connect with Ali Sher"
                  >
                    <FiArrowUpRight size={15} />
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
