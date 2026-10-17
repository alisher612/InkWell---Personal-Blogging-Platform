import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiLayout,
  FiBookmark,
  FiShield,
  FiArrowUpRight,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
      setMenuOpen(false);
      navigate("/", { replace: true });
    } catch {
      setLogoutError("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const displayName = user?.name?.trim() || (isAdmin ? "Administrator" : "Member");
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const navLinkClass = ({ isActive }) =>
    `inkwell-nav-link${isActive ? " is-active" : ""}`;

  return (
    <>
      <header className="inkwell-header">
        <nav className="navbar navbar-expand-lg inkwell-navbar">
          <div className="container inkwell-navbar-container">
            <Link
              className="navbar-brand inkwell-brand"
              to="/"
              onClick={closeMenu}
              aria-label="InkWell home"
            >
              <span className="inkwell-brand-icon">
                <FiBookOpen size={23} strokeWidth={2.1} />
                <span className="inkwell-brand-spark" />
              </span>

              <span className="inkwell-brand-word">
                Ink<span>Well</span>
              </span>
            </Link>

            <button
              className={`navbar-toggler inkwell-menu-toggle${menuOpen ? " is-open" : ""}`}
              type="button"
              aria-controls="inkwellMainNavbar"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>

            <div
              className={`collapse navbar-collapse inkwell-navbar-collapse${menuOpen ? " show" : ""}`}
              id="inkwellMainNavbar"
            >
              <div className="navbar-nav mx-auto inkwell-nav-links">
                <NavLink
                  className={navLinkClass}
                  to="/"
                  end
                  onClick={closeMenu}
                >
                  Home
                </NavLink>

                <NavLink
                  className={navLinkClass}
                  to="/blogs"
                  onClick={closeMenu}
                >
                  Explore Blogs
                </NavLink>

                {isAuthenticated && isAdmin && (
                  <NavLink
                    className={navLinkClass}
                    to="/admin"
                    onClick={closeMenu}
                  >
                    <FiLayout size={16} />
                    Dashboard
                  </NavLink>
                )}

                {isAuthenticated && !isAdmin && (
                  <NavLink
                    className={navLinkClass}
                    to="/saved"
                    onClick={closeMenu}
                  >
                    <FiBookmark size={16} />
                    Saved
                  </NavLink>
                )}
              </div>

              <div className="inkwell-navbar-actions">
                {isAuthenticated ? (
                  <>
                    <div className="inkwell-identity">
                      <span
                        className={`inkwell-avatar${isAdmin ? " inkwell-avatar-admin" : ""}`}
                      >
                        {isAdmin ? (
                          <FiShield size={18} />
                        ) : (
                          initials || <FiUser size={18} />
                        )}
                      </span>

                      <span className="inkwell-identity-copy">
                        <span className="inkwell-identity-name">
                          {displayName}
                        </span>
                        <span
                          className={`inkwell-role${isAdmin ? " inkwell-role-admin" : ""}`}
                        >
                          {isAdmin ? "Administrator" : "Member"}
                        </span>
                      </span>
                    </div>

                    <button
                      className="inkwell-logout-button"
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <FiLogOut size={16} />
                      <span>{loggingOut ? "Signing out..." : "Logout"}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      className="inkwell-login-button"
                      to="/login"
                      onClick={closeMenu}
                    >
                      Log in
                    </Link>

                    <Link
                      className="inkwell-start-button"
                      to="/register"
                      onClick={closeMenu}
                    >
                      Get Started
                      <FiArrowUpRight size={16} />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {logoutError && (
        <div className="container inkwell-navbar-error">
          <div className="alert alert-warning py-2 mb-0" role="alert">
            {logoutError}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
