#!/usr/bin/env node

const BASE_URL = (process.env.SMOKE_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const API_BASE = `${BASE_URL}/api`;

const SMOKE_EMAIL = String(process.env.SMOKE_STUDENT_EMAIL || "").trim().toLowerCase();
const SMOKE_PHONE = String(process.env.SMOKE_STUDENT_PHONE || "").trim();
const SMOKE_STUDENT_ID = String(process.env.SMOKE_STUDENT_ID || "SMOKE-STUDENT").trim();
const SMOKE_STUDENT_NAME = String(process.env.SMOKE_STUDENT_NAME || "API Smoke Student").trim();

const results = [];

const toErrorMessage = (error) => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return error.message || JSON.stringify(error);
};

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  return { response, payload };
}

async function runStep(name, action) {
  try {
    const details = await action();
    results.push({ name, ok: true, details });
    console.log(`PASS  ${name}${details ? ` :: ${details}` : ""}`);
    return { ok: true, details };
  } catch (error) {
    const message = toErrorMessage(error);
    results.push({ name, ok: false, details: message });
    console.error(`FAIL  ${name} :: ${message}`);
    return { ok: false, details: message };
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function getAnyStallWithMenu() {
  const stallsRes = await requestJson("/stalls");
  assert(stallsRes.response.ok, stallsRes.payload?.message || "Unable to fetch stalls");

  const stalls = Array.isArray(stallsRes.payload?.stalls)
    ? stallsRes.payload.stalls
    : Array.isArray(stallsRes.payload?.data)
    ? stallsRes.payload.data
    : [];
  assert(stalls.length > 0, "No stalls found for smoke test");

  for (const stall of stalls) {
    const stallId = String(stall?._id || stall?.id || "");
    if (!stallId) continue;

    const menuRes = await requestJson(`/menu-items/stall/${encodeURIComponent(stallId)}`);
    if (!menuRes.response.ok) continue;

    const menuItems = Array.isArray(menuRes.payload?.items)
      ? menuRes.payload.items
      : Array.isArray(menuRes.payload?.data)
      ? menuRes.payload.data
      : [];
    if (menuItems.length > 0) {
      return { stall, item: menuItems[0] };
    }
  }

  throw new Error("No stall with menu items found");
}

async function main() {
  console.log(`Running Campus Crave API smoke tests against ${API_BASE}`);

  if (!SMOKE_EMAIL) {
    console.warn("WARN  SMOKE_STUDENT_EMAIL is missing. Forgot-OTP and order-history checks may fail.");
  }

  await runStep("Forgot OTP request", async () => {
    assert(SMOKE_EMAIL, "Set SMOKE_STUDENT_EMAIL to test forgot OTP flow");

    const { response, payload } = await requestJson("/forgot-password/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: SMOKE_EMAIL }),
    });

    assert(response.ok, payload?.message || "Forgot OTP request failed");
    return payload?.message || "OTP request accepted";
  });

  let orderId = "";
  await runStep("Place order", async () => {
    const { stall, item } = await getAnyStallWithMenu();

    const qty = 1;
    const price = Number(item?.price || 0);
    const subtotal = Number((price * qty).toFixed(2));
    const tax = Number((subtotal * 0.05).toFixed(2));
    const totalAmount = Number((subtotal + tax).toFixed(2));

    const payload = {
      studentId: SMOKE_STUDENT_ID,
      studentName: SMOKE_STUDENT_NAME,
      studentEmail: SMOKE_EMAIL || "smoke.student@example.com",
      studentPhone: SMOKE_PHONE,
      stallId: String(stall?._id || stall?.id || ""),
      stallName: String(stall?.stallName || "Campus Stall"),
      stallOwner: String(stall?.owner || "N/A"),
      items: [
        {
          itemId: String(item?._id || item?.id || ""),
          itemName: String(item?.name || "Smoke Item"),
          quantity: qty,
          price,
          totalPrice: subtotal,
        },
      ],
      totalItems: qty,
      subtotal,
      tax,
      totalAmount,
      pickupTime: "12:00 PM - 12:30 PM",
      paymentMethod: "cash",
      paymentStatus: "Pending",
      specialInstructions: "API smoke test order",
    };

    const { response, payload: orderPayload } = await requestJson("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert(response.ok, orderPayload?.message || "Place order failed");
    orderId = String(orderPayload?.orderId || "");
    assert(orderId, "Order created but orderId missing in response");

    return `orderId=${orderId}`;
  });

  await runStep("Order history", async () => {
    assert(SMOKE_EMAIL, "Set SMOKE_STUDENT_EMAIL to validate order history");

    const { response, payload } = await requestJson(`/orders/student/${encodeURIComponent(SMOKE_EMAIL)}`);
    assert(response.ok, payload?.message || "Order history fetch failed");

    const orders = Array.isArray(payload?.orders) ? payload.orders : [];
    assert(orders.length > 0, "Order history returned empty list");

    const hasNewOrder = orderId
      ? orders.some((order) => String(order?.orderId || "") === orderId)
      : true;
    assert(hasNewOrder, `Placed order ${orderId} not found in order history`);

    return `orders=${orders.length}`;
  });

  await runStep("Bill download", async () => {
    assert(orderId, "orderId missing from previous step");

    const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/bill`);
    assert(response.ok, `Bill download failed with ${response.status}`);

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    assert(contentType.includes("application/pdf"), `Unexpected bill content-type: ${contentType || "none"}`);

    return "PDF response verified";
  });

  await runStep("WhatsApp send", async () => {
    assert(orderId, "orderId missing from previous step");

    const body = SMOKE_PHONE ? { phoneNumber: SMOKE_PHONE } : {};
    const { response, payload } = await requestJson(`/orders/${encodeURIComponent(orderId)}/send-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    assert(response.ok, payload?.message || "WhatsApp send failed");
    return payload?.message || "WhatsApp send accepted";
  });

  const failed = results.filter((entry) => !entry.ok);
  const passed = results.length - failed.length;

  console.log(`\nSummary: ${passed}/${results.length} passed`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Fatal: ${toErrorMessage(error)}`);
  process.exit(1);
});
