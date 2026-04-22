const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function parseJson(response) {
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed");
  }
  return payload;
}

export async function fetchAllStalls() {
  const response = await fetch(`${API_BASE}/stalls`);
  const payload = await parseJson(response);
  return payload?.stalls || [];
}

export async function fetchStallByOwnerEmail(email) {
  const response = await fetch(`${API_BASE}/stalls/owner/${encodeURIComponent(email)}`);
  const payload = await parseJson(response);
  return payload?.stall || null;
}

export async function createStall(payload) {
  const response = await fetch(`${API_BASE}/stalls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function updateStallById(id, payload) {
  const response = await fetch(`${API_BASE}/stalls/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function deleteStallById(id) {
  const response = await fetch(`${API_BASE}/stalls/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return parseJson(response);
}

export async function fetchMenuItems(stallId) {
  const url = stallId
    ? `${API_BASE}/menu-items/stall/${encodeURIComponent(stallId)}`
    : `${API_BASE}/menu-items`;

  const response = await fetch(url);
  const payload = await parseJson(response);
  return payload?.items || [];
}

export async function createMenuItem(payload) {
  const response = await fetch(`${API_BASE}/menu-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function updateMenuItemById(id, payload) {
  const response = await fetch(`${API_BASE}/menu-items/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function deleteMenuItemById(id) {
  const response = await fetch(`${API_BASE}/menu-items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return parseJson(response);
}
