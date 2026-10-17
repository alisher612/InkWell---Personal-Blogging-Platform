
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiBookOpen, FiLock, FiMail } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      const destination = location.state?.from || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <Link to="/" className="auth-brand">
            <span className="brand-icon"><FiBookOpen /></span>
            <span>Ink<span className="brand-accent">Well</span></span>
          </Link>

          <span className="eyebrow">WELCOME BACK</span>
          <h1>Good to see you again.</h1>
          <p className="auth-description">
            Sign in to continue reading, save stories, and join the conversation.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <div className="auth-input-wrap">
                <FiMail />
                <input
                  id="login-email"
                  className="form-control"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <FiLock />
                <input
                  id="login-password"
                  className="form-control"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-ink btn-lg rounded-pill w-100"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
              {!submitting && <FiArrowRight className="ms-2" />}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
