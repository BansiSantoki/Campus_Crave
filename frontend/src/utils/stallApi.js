const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ALLOW_LOCAL_FALLBACK = import.meta.env.VITE_ALLOW_LOCAL_FALLBACK === "true";

import {
  assignStallToOwner,
  getDisplayName,
  getMenuItems as getLocalMenuItems,
  getStalls as getLocalStalls,
} from "./appData";

async function parseJson(response) {
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed");
  }
  return payload;
}

function normalizeStall(stall) {
  const stableId = stall?.id || stall?._id || stall?.stallId || "";
  return {
    ...stall,
    id: stableId,
    _id: stall?._id || (typeof stableId === "string" ? stableId : undefined),
    ownerEmail: String(stall?.ownerEmail || "").toLowerCase(),
  };
}

function normalizeMenuItem(item) {
  return {
    ...item,
    id: item?.id || item?._id,
    stallId: item?.stallId || item?.stall?._id || item?.stall,
  };
}

export async function fetchAllStalls() {
  try {
    const response = await fetch(`${API_BASE}/stalls`);
    const payload = await parseJson(response);
    return (payload?.stalls || []).map(normalizeStall);
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) {
      throw error;
    }

    // Optional fallback to local seed data when backend is unavailable.
    return getLocalStalls().map(normalizeStall);
  }
}

export async function fetchStallByOwnerEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Owner email is required");
  }

  const response = await fetch(`${API_BASE}/stalls/owner/${encodeURIComponent(normalizedEmail)}`);
  const payload = await parseJson(response);
  return payload?.stall ? normalizeStall(payload.stall) : null;
}

export async function resolveStallForOwner(user) {
  const ownerEmail = String(user?.email || "").trim().toLowerCase();
  const ownerName = getDisplayName(user).toLowerCase();
  const ownerStallName = String(user?.stallName || "").trim().toLowerCase();

  if (ownerEmail) {
    try {
      const apiStall = await fetchStallByOwnerEmail(ownerEmail);
      if (apiStall) {
        return apiStall;
      }
    } catch {
      // Fall back to local owner mapping when backend lookup is unavailable.
    }
  }

  const localStalls = getLocalStalls().map(normalizeStall);

  const byEmail = localStalls.find(
    (stall) => String(stall.ownerEmail || "").toLowerCase() === ownerEmail
  );
  if (byEmail) {
    return byEmail;
  }

  if (ownerStallName) {
    const byStallName = localStalls.find(
      (stall) => String(stall.stallName || "").trim().toLowerCase() === ownerStallName
    );
    if (byStallName) {
      return byStallName;
    }
  }

  const byOwnerName = localStalls.find(
    (stall) => String(stall.owner || "").trim().toLowerCase() === ownerName
  );
  if (byOwnerName) {
    return byOwnerName;
  }

  return assignStallToOwner(user);
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
  try {
    const url = stallId
      ? `${API_BASE}/menu-items/stall/${encodeURIComponent(stallId)}`
      : `${API_BASE}/menu-items`;

    const response = await fetch(url);
    const payload = await parseJson(response);
    const apiItems = (payload?.items || []).map(normalizeMenuItem);

    if (!stallId) {
      return apiItems;
    }

    // Defensive filter so UI only gets selected stall items even if backend returns extra rows.
    return apiItems.filter((item) => String(item.stallId) === String(stallId));
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) {
      throw error;
    }

    // Optional fallback to local seed data when backend is unavailable or errors.
    const localItems = getLocalMenuItems().map(normalizeMenuItem);
    if (!stallId) {
      return localItems;
    }
    return localItems.filter((item) => String(item.stallId) === String(stallId));
  }
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
