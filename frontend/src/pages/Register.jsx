
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiArrowRight, FiBookOpen, FiLock, FiMail, FiUser } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const validationMessage = data?.errors?.[0]?.msg;

      setError(
        validationMessage ||
          data?.message ||
          "Registration failed. Please try again."
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

          <span className="eyebrow">JOIN THE COMMUNITY</span>
          <h1>Every reader has a story.</h1>
          <p className="auth-description">
            Create your account to rate articles, comment, and save stories for later.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-name">Full name</label>
              <div className="auth-input-wrap">
                <FiUser />
                <input
                  id="register-name"
                  className="form-control"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  minLength={2}
                  maxLength={60}
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="register-email">Email address</label>
              <div className="auth-input-wrap">
                <FiMail />
                <input
                  id="register-email"
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

            <div className="mb-3">
              <label className="form-label" htmlFor="register-password">Password</label>
              <div className="auth-input-wrap">
                <FiLock />
                <input
                  id="register-password"
                  className="form-control"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="register-confirm-password">
                Confirm password
              </label>
              <div className="auth-input-wrap">
                <FiLock />
                <input
                  id="register-confirm-password"
                  className="form-control"
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  value={form.confirmPassword}
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
              {submitting ? "Creating account..." : "Create account"}
              {!submitting && <FiArrowRight className="ms-2" />}
            </button>
          </form>

          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Register;
