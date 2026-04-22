const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function parseJson(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || payload?.msg || "Request failed");
  }
  return payload;
}

export async function registerStudent(payload) {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function registerUser(payload) {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function loginUser(payload) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function forgotPasswordUser(payload) {
  const response = await fetch(`${API_BASE}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function requestForgotPasswordOtp(payload) {
  const response = await fetch(`${API_BASE}/forgot-password/request-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function resetForgotPasswordWithOtp(payload) {
  const response = await fetch(`${API_BASE}/forgot-password/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function fetchRegistrations() {
  const response = await fetch(`${API_BASE}/register`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to fetch registrations");
  }

  return payload?.data || [];
}

export async function createRegistration(payload) {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function updateRegistrationById(id, payload) {
  const isFormDataPayload = payload instanceof FormData;
  const response = await fetch(`${API_BASE}/register/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: isFormDataPayload
      ? undefined
      : {
          "Content-Type": "application/json",
        },
    body: isFormDataPayload ? payload : JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function deleteRegistrationById(id) {
  const response = await fetch(`${API_BASE}/register/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to delete registration");
  }

  return payload;
}
