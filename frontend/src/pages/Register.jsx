
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h2>Stockwise</h2>
        </div>

        <div className="auth-intro">
          <span>GET STARTED</span>
          <h1>Bring every stock detail together.</h1>
          <p>
            Create your account to manage inventory
            and purchasing activities.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Create account</h2>
          <p>Register your workspace account.</p>

          {error && <div className="error-message">{error}</div>}

          <label>Full name</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />

          <label>Email address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            required
          />

          <label>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            placeholder="Minimum 8 characters"
            required
          />

          <button
            className="primary-button full-width"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <div className="auth-footer">
            Already registered? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
