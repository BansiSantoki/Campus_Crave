const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function parseJson(response) {
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed");
  }
  return payload;
}

export async function fetchActivityLog(limit = 50) {
  const response = await fetch(`${API_BASE}/activities?limit=${encodeURIComponent(limit)}`);
  const payload = await parseJson(response);
  return payload?.activities || [];
}
