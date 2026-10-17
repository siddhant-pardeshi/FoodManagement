import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import DonorDashboard from "./pages/DonorDashboard";
import AvailableFood from "./pages/AvailableFood";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

const GUEST_ONLY = new Set(["/login", "/register"]);

/** Where each role lands after signing in. */
const HOME_BY_ROLE = {
  DONOR: "/donor-dashboard",
  RECEIVER: "/available-food",
  ADMIN: "/admin",
};

const homeFor = (user) => (user && HOME_BY_ROLE[user.role]) || "/";

/** Redirects guests to the login page and role-gates the dashboards. */
function ProtectedRoute({ user, allowedRole, children }) {
  if (!user || (allowedRole && user.role !== allowedRole)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/** Resets scroll position on every navigation. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const logout = () => setUser(null);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app">
        <Navbar user={user} logout={logout} />
        {/* Keyed on pathname so each route mounts with the page-enter animation */}
        <MainRoutes user={user} setUser={setUser} logout={logout} />
      </div>
    </BrowserRouter>
  );
}

function MainRoutes({ user, setUser }) {
  const { pathname } = useLocation();
  const guestOnly = GUEST_ONLY.has(pathname);

  return (
    <main className="main-content" key={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={user ? <Navigate to={homeFor(user)} replace /> : <Login setUser={setUser} />}
        />
        <Route path="/register" element={user ? <Navigate to={homeFor(user)} replace /> : <Register />} />

        <Route
          path="/donor-dashboard"
          element={
            <ProtectedRoute user={user} allowedRole="DONOR">
              <DonorDashboard user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/available-food"
          element={
            <ProtectedRoute user={user} allowedRole="RECEIVER">
              <AvailableFood user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-requests"
          element={
            <ProtectedRoute user={user} allowedRole="RECEIVER">
              <ReceiverDashboard user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {guestOnly ? null : <footer className="app-footer">Khaana Bachaao — every plate saved feeds a life.</footer>}
    </main>
  );
}

export default App;
