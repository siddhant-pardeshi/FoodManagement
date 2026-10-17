import { useState, useEffect } from "react";
import { getAvailableFood, createRequest } from "../api";

/**
 * Receiver view of the donation board: everything currently marked AVAILABLE,
 * with a dialog to raise a request against a listing.
 */
export default function AvailableFood({ user }) {
  const [food, setFood] = useState([]);
  const [note, setNote] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadFood = async () => {
    try {
      setFood(await getAvailableFood());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadFood();
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createRequest({
        listingId: selectedFood.id,
        receiverId: user.id,
        requestNote: note,
      });
      setMessage(`Request sent for “${selectedFood.foodItem}”!`);
      setSelectedFood(null);
      setNote("");
      loadFood();
    } catch (err) {
      setError(err.message);
      setSelectedFood(null);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>Available Food</h2>
          <p className="page-subtitle">Fresh listings posted by donors near you.</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {food.length === 0 && (
        <p className="empty-state">No available food right now. Check back later!</p>
      )}

      <div className="card-grid">
        {food.map((item) => (
          <div key={item.id} className="card">
            <div className="card-title-row">
              <h3>{item.foodItem}</h3>
              <span className="badge badge-available">AVAILABLE</span>
            </div>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <p><strong>Category:</strong> {item.category}</p>
            <p><strong>Best before:</strong> {item.expiryDate}</p>
            <div className="card-actions">
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedFood(item)}>
                Request This Food
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedFood && (
        <div className="modal-overlay" onClick={() => setSelectedFood(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Request: {selectedFood.foodItem}</h3>
            <p>Quantity: {selectedFood.quantity} | Category: {selectedFood.category}</p>
            <form onSubmit={handleRequest}>
              <label>
                Note to donor (optional):
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. I can pick up anytime today"
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="btn btn-success">Send Request</button>
                <button type="button" className="btn" onClick={() => { setSelectedFood(null); setNote(""); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
