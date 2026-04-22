const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

import { getMenuCategories, setCategories as setStoredCategories } from "./appData";

async function parseJson(response) {
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed");
  }
  return payload;
}

function normalizeCategory(category) {
  if (!category) {
    return null;
  }

  return {
    ...category,
    id: category.id || category._id,
    name: String(category.name || "").trim(),
    description: category.description || "",
    status: category.status || "Active",
  };
}

function syncStoredCategories(categories) {
  const normalized = (categories || [])
    .map(normalizeCategory)
    .filter(Boolean)
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      status: category.status,
    }));

  setStoredCategories(normalized.length > 0 ? normalized : getMenuCategories());
  return normalized;
}

export async function fetchCategories(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);

    const url = query.toString()
      ? `${API_BASE}/categories?${query.toString()}`
      : `${API_BASE}/categories`;
    const response = await fetch(url);
    const payload = await parseJson(response);
    const categories = (payload?.categories || []).map(normalizeCategory).filter(Boolean);

    if (categories.length > 0) {
      syncStoredCategories(categories);
      return categories;
    }
  } catch {
    // Fallback to local data.
  }

  return getMenuCategories().map((name) => ({
    id: name,
    name,
    description: "",
    status: "Active",
  }));
}

export async function createCategory(payload) {
  try {
    const response = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response);
    await fetchCategories();
    return data;
  } catch (error) {
    const stored = await fetchCategories();
    const newCategory = {
      id: payload.name,
      name: String(payload.name || "").trim(),
      description: payload.description || "",
      status: payload.status || "Active",
    };
    syncStoredCategories([...stored, newCategory]);
    return { success: true, category: newCategory, message: error.message || "Category saved locally" };
  }
}

export async function updateCategoryById(id, payload) {
  try {
    const response = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response);
    await fetchCategories();
    return data;
  } catch (error) {
    const stored = await fetchCategories();
    const updated = stored.map((category) =>
      String(category.id || category.name) === String(id)
        ? { ...category, ...payload, name: String(payload.name || category.name || "").trim() }
        : category,
    );
    syncStoredCategories(updated);
    return { success: true, message: error.message || "Category updated locally" };
  }
}

export async function deleteCategoryById(id) {
  try {
    const response = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await parseJson(response);
    await fetchCategories();
    return data;
  } catch (error) {
    const stored = await fetchCategories();
    const filtered = stored.filter((category) => String(category.id || category.name) !== String(id));
    syncStoredCategories(filtered);
    return { success: true, message: error.message || "Category deleted locally" };
  }
}