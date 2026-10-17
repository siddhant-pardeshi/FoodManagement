import { useState, useEffect, useCallback } from "react";
import {
  getFoodByDonor,
  createFood,
  deleteFood,
  getRequestsByListing,
  approveRequest,
  rejectRequest,
} from "../api";

/**
 * Donor workspace: post new listings, delete expired ones and review the
 * requests receivers have raised against each listing.
 */
export default function DonorDashboard({ user }) {
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ foodItem: "", quantity: "", category: "Cooked", expiryDate: "" });

  const loadListings = useCallback(async () => {
    try {
      setListings(await getFoodByDonor(user.id));
    } catch (err) {
      setError(err.message);
    }
  }, [user.id]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createFood({ ...form, quantity: parseInt(form.quantity, 10), donorId: user.id });
      setForm({ foodItem: "", quantity: "", category: "Cooked", expiryDate: "" });
      setShowForm(false);
      loadListings();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this food listing?")) {
      try {
        await deleteFood(id);
        loadListings();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const viewRequests = async (listingId) => {
    if (requests[listingId]) {
      setRequests({ ...requests, [listingId]: null });
      return;
    }
    const data = await getRequestsByListing(listingId);
    setRequests({ ...requests, [listingId]: data });
  };

  const handleDecision = async (requestId, action) => {
    await action(requestId);
    setRequests({});
    loadListings();
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>My Food Listings</h2>
          <p className="page-subtitle">Hi {user.name.split(" ")[0]} — here is what you've posted so far.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add New Food"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate}>
          <h3>Post Food for Donation</h3>
          <label>
            Food Item:
            <input name="foodItem" value={form.foodItem} onChange={handleChange} required placeholder="e.g. Cooked Rice" />
          </label>
          <label>
            Quantity:
            <input
              name="quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={handleChange}
              required
              placeholder="e.g. 20"
            />
          </label>
          <label>
            Category:
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="Cooked">Cooked</option>
              <option value="Raw">Raw</option>
              <option value="Packaged">Packaged</option>
              <option value="Beverages">Beverages</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            Best Before:
            <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} required />
          </label>
          <button type="submit" className="btn btn-success">Post Food</button>
        </form>
      )}

      {listings.length === 0 && !showForm && (
        <p className="empty-state">You haven't posted any food listings yet. Click “+ Add New Food” to start!</p>
      )}

      <div className="card-grid">
        {listings.map((item) => (
          <div key={item.id} className="card">
            <div className="card-title-row">
              <h3>{item.foodItem}</h3>
              <span className={`badge badge-${item.status.toLowerCase()}`}>{item.status}</span>
            </div>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <p><strong>Category:</strong> {item.category}</p>
            <p><strong>Best before:</strong> {item.expiryDate}</p>
            <div className="card-actions">
              <button className="btn btn-sm" onClick={() => viewRequests(item.id)}>
                {requests[item.id] ? "Hide Requests" : "View Requests"}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
            </div>

            {requests[item.id] && (
              <div className="requests-list">
                {requests[item.id].length === 0 ? (
                  <p className="empty-state small">No requests yet.</p>
                ) : (
                  requests[item.id].map((req) => (
                    <div key={req.id} className="request-item">
                      <p>
                        <strong>Request #{req.id}</strong> — <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                      </p>
                      {req.requestNote && <p><em>“{req.requestNote}”</em></p>}
                      {req.status === "PENDING" && (
                        <div className="card-actions">
                          <button className="btn btn-sm btn-success" onClick={() => handleDecision(req.id, approveRequest)}>
                            Approve
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDecision(req.id, rejectRequest)}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
