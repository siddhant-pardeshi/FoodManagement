import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRequestsByReceiver } from "../api";

/** Request history for the signed-in receiver, with live status badges. */
export default function ReceiverDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getRequestsByReceiver(user.id)
      .then(setRequests)
      .catch((err) => setError(err.message));
  }, [user.id]);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>My Requests</h2>
          <p className="page-subtitle">Track everything you've asked for and where it stands.</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {requests.length === 0 && !error && (
        <p className="empty-state">
          You haven't made any requests yet. <Link to="/available-food">Browse available food</Link>
        </p>
      )}

      <div className="card-grid">
        {requests.map((req) => (
          <div key={req.id} className="card">
            <div className="card-title-row">
              <h3>Request #{req.id}</h3>
              <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
            </div>
            <p><strong>Food Listing ID:</strong> {req.listingId}</p>
            <p><strong>Requested on:</strong> {req.createdAt}</p>
            {req.requestNote && <p><em>“{req.requestNote}”</em></p>}
          </div>
        ))}
      </div>
    </div>
  );
}
