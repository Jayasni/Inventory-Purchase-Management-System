
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
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
          <Leaf size={26} />
          <h2>Stockwise</h2>
        </div>

        <div className="auth-intro">
          <span>INVENTORY MANAGEMENT</span>
          <h1>Know your stock. Move with confidence.</h1>
          <p>
            Manage your products, suppliers and purchase
            activities in one organised workspace.
          </p>
        </div>

        <small>Simple tools. Better visibility.</small>
      </div>

      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p>Sign in to your inventory workspace.</p>

          {error && <div className="error-message">{error}</div>}

          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <button
            className="primary-button full-width"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
