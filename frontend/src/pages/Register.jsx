import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { registerUser } from "../api";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "DONOR",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await registerUser(form);
      navigate("/login");
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
            <h1>Join the Movement.</h1>
            <p>
              Become a donor or a receiver today, and help make sure good food reaches people
              who need it — not the landfill.
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
          <h2>Create an Account</h2>
          <p className="subtitle">Sign up to start sharing or receiving food.</p>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Full Name
              <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
            </label>
            <label>
              Email Address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </label>

            <div className="form-row">
              <label>
                Phone (Optional)
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
              </label>
              <label>
                I want to
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="DONOR">Donate food</option>
                  <option value="RECEIVER">Receive food</option>
                </select>
              </label>
            </div>

            <label>
              Address (Optional)
              <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" />
            </label>

            <button type="submit" className="btn btn-primary auth-btn" disabled={submitting}>
              {submitting ? "Creating account…" : "Register"}
            </button>
          </form>

          <p className="auth-prompt">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
