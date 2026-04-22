const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function parseJson(response) {
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed");
  }
  return payload;
}

export async function submitReview(payload) {
  const response = await fetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function fetchReviews(stallId) {
  const url = stallId
    ? `${API_BASE}/reviews?stallId=${encodeURIComponent(stallId)}`
    : `${API_BASE}/reviews`;

  const response = await fetch(url);
  const payload = await parseJson(response);
  return payload?.reviews || [];
}
