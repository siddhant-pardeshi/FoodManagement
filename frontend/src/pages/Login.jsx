import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { loginUser } from "../api";
import "./Auth.css";

const HOME_BY_ROLE = {
  DONOR: "/donor-dashboard",
  RECEIVER: "/available-food",
  ADMIN: "/admin",
};

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await loginUser({ email, password });
      setUser(user);
      navigate(HOME_BY_ROLE[user.role] || "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-image-section">
        <div className="auth-image-overlay">
          <div className="auth-hero-text">
            <h1>Zero Food Waste.</h1>
            <p>
              Connect with donors and receivers to share surplus food and make a tangible
              difference in your community.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-form-card">
          <div className="brand">
            <UtensilsCrossed size={22} color="var(--color-primary)" />
            Khaana Bachaao
          </div>
          <h2>Welcome Back</h2>
          <p className="subtitle">Please enter your details to sign in.</p>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email Address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </label>
            <button type="submit" className="btn btn-primary auth-btn" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="auth-prompt">
            Don't have an account? <Link to="/register">Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
