import { useState, useEffect } from "react";
import { getAllFood, getAllUsers, getAllRequests } from "../api";

/**
 * Platform-wide overview: users, listings and request activity. Each fetch is
 * independent so one failing endpoint blanks only its own section.
 */
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [food, setFood] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const userData = await getAllUsers();
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (err) {
        console.error("Failed to load users", err);
        setUsers([]);
        setError(err.message);
      }
      try {
        setFood(await getAllFood());
      } catch (err) {
        console.error("Failed to load food listings", err);
        setFood([]);
      }
      try {
        setRequests(await getAllRequests());
      } catch (err) {
        console.error("Failed to load requests", err);
        setRequests([]);
      }
    };
    load();
  }, []);

  const stats = [
    { value: users.length, label: "Total Users" },
    { value: users.filter((u) => u.role === "DONOR").length, label: "Donors" },
    { value: users.filter((u) => u.role === "RECEIVER").length, label: "Receivers" },
    { value: food.filter((f) => f.status === "DONATED").length, label: "Listings Donated" },
    { value: food.filter((f) => f.status === "AVAILABLE").length, label: "Available Now" },
    { value: requests.filter((r) => r.status === "APPROVED").length, label: "Requests Approved" },
    { value: requests.filter((r) => r.status === "PENDING").length, label: "Requests Pending" },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="page-subtitle">Everything happening across the platform, at a glance.</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>

      <h3 className="table-heading">All Users</h3>
      {users.length === 0 ? (
        <p className="empty-state">No users registered yet.</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                  <td>{u.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="table-heading">All Food Listings</h3>
      {food.length === 0 ? (
        <p className="empty-state">No food listings yet.</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Food Item</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Best Before</th>
                <th>Donor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {food.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.foodItem}</td>
                  <td>{f.quantity}</td>
                  <td>{f.category}</td>
                  <td>{f.expiryDate}</td>
                  <td>{users.find((u) => u.id === f.donorId)?.name ?? `#${f.donorId}`}</td>
                  <td><span className={`badge badge-${f.status.toLowerCase()}`}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="table-heading">All Food Requests</h3>
      {requests.length === 0 ? (
        <p className="empty-state">No food requests yet.</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Listing</th>
                <th>Receiver</th>
                <th>Note</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{food.find((f) => f.id === r.listingId)?.foodItem ?? `#${r.listingId}`}</td>
                  <td>{users.find((u) => u.id === r.receiverId)?.name ?? `#${r.receiverId}`}</td>
                  <td>{r.requestNote || "—"}</td>
                  <td>{r.createdAt}</td>
                  <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
