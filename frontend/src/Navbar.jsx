import { NavLink, Link } from "react-router-dom";
import { Utensils, LogOut, LayoutDashboard, HeartHandshake, Settings, ClipboardList } from "lucide-react";

const linkClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

export default function Navbar({ user, logout }) {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Utensils size={28} color="var(--color-primary)" />
        <span>Khaana <span className="brand-accent">Bachaao</span></span>
      </Link>

      <div className="nav-links">
        {!user && (
          <>
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/register" className={linkClass}>Get Involved</NavLink>
          </>
        )}

        {user?.role === "DONOR" && (
          <NavLink to="/donor-dashboard" className={linkClass}>
            <LayoutDashboard size={18} /> My Dashboard
          </NavLink>
        )}

        {user?.role === "RECEIVER" && (
          <>
            <NavLink to="/available-food" className={linkClass}>
              <HeartHandshake size={18} /> Available Food
            </NavLink>
            <NavLink to="/my-requests" className={linkClass}>
              <ClipboardList size={18} /> My Requests
            </NavLink>
          </>
        )}

        {user?.role === "ADMIN" && (
          <NavLink to="/admin" className={linkClass}>
            <Settings size={18} /> Admin Dashboard
          </NavLink>
        )}
      </div>

      <div className="nav-user">
        {!user ? (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Donate / Request</Link>
          </>
        ) : (
          <>
            <span className="badge badge-role">
              {user.name} · {user.role}
            </span>
            <button className="btn btn-logout" onClick={logout}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
