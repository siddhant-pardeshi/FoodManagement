/**
 * Thin fetch wrapper for the backend API. In production the API is served
 * from the same origin (/api), so no configuration is needed. Set
 * VITE_API_BASE_URL only to target a different host. Non-2xx responses
 * throw an Error carrying the message returned by the API.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      (body && body.message) || (typeof body === "string" && body) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

// ---- Auth ----
export const registerUser = (user) => request("/auth/register", { method: "POST", body: JSON.stringify(user) });
export const loginUser = (user) => request("/auth/login", { method: "POST", body: JSON.stringify(user) });
export const getAllUsers = () => request("/auth/users");

// ---- Food listings ----
export const getAllFood = () => request("/food");
export const getAvailableFood = () => request("/food/available");
export const getFoodByDonor = (donorId) => request(`/food/donor/${donorId}`);
export const createFood = (listing) => request("/food", { method: "POST", body: JSON.stringify(listing) });
export const updateFood = (id, listing) => request(`/food/${id}`, { method: "PUT", body: JSON.stringify(listing) });
export const deleteFood = (id) => request(`/food/${id}`, { method: "DELETE" });

// ---- Food requests ----
export const getAllRequests = () => request("/requests");
export const createRequest = (req) => request("/requests", { method: "POST", body: JSON.stringify(req) });
export const getRequestsByReceiver = (receiverId) => request(`/requests/receiver/${receiverId}`);
export const getRequestsByListing = (listingId) => request(`/requests/listing/${listingId}`);
export const approveRequest = (id) => request(`/requests/${id}/approve`, { method: "PUT" });
export const rejectRequest = (id) => request(`/requests/${id}/reject`, { method: "PUT" });
