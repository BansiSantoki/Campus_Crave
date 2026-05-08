import { createOrder, getOrders, updateOrderStatus } from "./appData";
import { getOrderStatusLabel } from "./orderInsights";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ALLOW_LOCAL_FALLBACK = import.meta.env.VITE_ALLOW_LOCAL_FALLBACK === "true";

function normalizeItem(item) {
  return {
    itemId: item?.itemId || item?.id || "",
    itemName: item?.itemName || item?.name || "Item",
    quantity: Number(item?.quantity || 0),
    price: Number(item?.price || 0),
    totalPrice: Number(item?.totalPrice || Number(item?.price || 0) * Number(item?.quantity || 0)),
  };
}

export function normalizeOrder(order) {
  const items = Array.isArray(order?.items) ? order.items.map(normalizeItem) : [];
  const totalItems = Number(
    order?.totalItems ||
      order?.qty ||
      items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  );
  const status = order?.orderStatus || order?.status || "New";

  return {
    id: order?.orderId || order?.id,
    orderId: order?.orderId || order?.id,
    studentName: order?.studentName || "Unknown Student",
    studentEmail: order?.studentEmail || "",
    studentId: order?.studentId || "N/A",
    studentPhone: order?.studentPhone || "",
    stallId: order?.stallId,
    stallName: order?.stallName || "Campus Stall",
    stallOwner: order?.stallOwner || "N/A",
    items,
    qty: totalItems,
    totalItems,
    subtotal: Number(order?.subtotal || 0),
    tax: Number(order?.tax || 0),
    totalAmount: Number(order?.totalAmount || 0),
    pickupTime: order?.pickupTime || "",
    paymentMethod: order?.paymentMethod || "cash",
    paymentStatus: order?.paymentStatus || "Pending",
    paymentReference: order?.paymentReference || "",
    billPdfUrl: order?.billPdfUrl || "",
    specialInstructions: order?.specialInstructions || "",
    status,
    orderStatus: status,
    statusLabel: getOrderStatusLabel(status),
    whatsappSent: Boolean(order?.whatsappSent),
    whatsappSentAt: order?.whatsappSentAt || null,
    whatsappError: order?.whatsappError || "",
    studentRating: Number(order?.studentRating || 0),
    studentReview: order?.studentReview || "",
    studentReviewedAt: order?.studentReviewedAt || null,
    createdAt: order?.createdAt || new Date().toISOString(),
    updatedAt: order?.updatedAt || order?.createdAt || new Date().toISOString(),
  };
}

async function parseResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    const backendError = [payload?.message, payload?.error, payload?.details]
      .filter(Boolean)
      .join(" - ");
    throw new Error(backendError || "Request failed");
  }
  return payload;
}

export async function fetchAllOrders() {
  try {
    const response = await fetch(`${API_BASE}/orders`);
    const payload = await parseResponse(response);
    return {
      success: true,
      orders: (payload.orders || []).map(normalizeOrder),
      source: "api",
    };
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) {
      throw error;
    }

    return {
      success: true,
      orders: getOrders().map(normalizeOrder),
      source: "local",
    };
  }
}

export async function fetchOrdersByStudent(email) {
  if (!email) return { success: true, orders: [], source: "api" };

  try {
    const response = await fetch(`${API_BASE}/orders/student/${encodeURIComponent(email)}`);
    const payload = await parseResponse(response);
    return {
      success: true,
      orders: (payload.orders || []).map(normalizeOrder),
      source: "api",
    };
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) {
      throw error;
    }

    const fallback = getOrders()
      .map(normalizeOrder)
      .filter((order) => order.studentEmail === email);
    return {
      success: true,
      orders: fallback,
      source: "local",
    };
  }
}

export async function fetchOrdersByStall(stallId) {
  if (!stallId) return { success: true, orders: [], source: "api" };

  try {
    const response = await fetch(`${API_BASE}/orders/stall/${encodeURIComponent(stallId)}`);
    const payload = await parseResponse(response);
    return {
      success: true,
      orders: (payload.orders || []).map(normalizeOrder),
      source: "api",
    };
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) {
      throw error;
    }

    const fallback = getOrders()
      .map(normalizeOrder)
      .filter((order) => String(order.stallId) === String(stallId));
    return {
      success: true,
      orders: fallback,
      source: "local",
    };
  }
}

export async function createOrderRequest(payload) {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const parsed = await parseResponse(response);
    return {
      success: true,
      order: normalizeOrder(parsed.order),
      orderId: parsed.orderId,
      whatsappSent: Boolean(parsed.whatsappSent),
      whatsappTarget: parsed.whatsappTarget || null,
      whatsappMessage: parsed.whatsappMessage || "",
      whatsappError: parsed.whatsappError || "",
      billPdfUrl: parsed.billPdfUrl || parsed.order?.billPdfUrl || "",
      source: "api",
    };
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) {
      throw error;
    }

    const localOrder = createOrder({
      student: {
        email: payload.studentEmail,
        studentId: payload.studentId,
        firstName: payload.studentName,
        fullname: payload.studentName,
      },
      stall: {
        id: payload.stallId,
        stallName: payload.stallName,
        owner: payload.stallOwner,
      },
      pickupTime: payload.pickupTime,
      specialInstructions: payload.specialInstructions,
      paymentMethod: payload.paymentMethod,
      items: (payload.items || []).map((item) => ({
        id: item.itemId,
        name: item.itemName,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: payload.totalAmount,
    });

    return {
      success: true,
      order: normalizeOrder(localOrder),
      orderId: localOrder.id,
      whatsappSent: false,
      whatsappTarget: null,
      whatsappMessage: "Order saved locally. WhatsApp bill not sent.",
      billPdfUrl: "",
      source: "local",
    };
  }
}

export async function sendOrderBillWhatsAppRequest(orderId, phoneNumber) {
  try {
    const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/send-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(phoneNumber ? { phoneNumber } : {}),
    });

    const payload = await parseResponse(response);
    return {
      success: true,
      message: payload.message || "WhatsApp bill sent",
      whatsappTarget: payload.whatsappTarget || null,
      billPdfUrl: payload.billPdfUrl || "",
      source: "api",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to send WhatsApp bill",
      source: "api",
    };
  }
}

export async function updateOrderStatusRequest(orderId, status) {
  try {
    const normalizedStatus = status === "Prepared" ? "Preparing" : status;
    const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: normalizedStatus }),
    });

    const parsed = await parseResponse(response);
    return {
      success: true,
      order: normalizeOrder(parsed.order),
      source: "api",
    };
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) {
      throw error;
    }

    updateOrderStatus(orderId, status === "Prepared" ? "Preparing" : status);
    const fallback = getOrders().map(normalizeOrder).find((order) => order.id === orderId) || null;
    return {
      success: true,
      order: fallback,
      source: "local",
    };
  }
}

export async function createRazorpayOrderRequest(orderId) {
  const response = await fetch(`${API_BASE}/payments/razorpay/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });

  return parseResponse(response);
}

export async function verifyRazorpayPaymentRequest(payload) {
  const response = await fetch(`${API_BASE}/payments/razorpay/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function submitOrderReviewRequest(orderId, payload) {
  const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse(response);
  return {
    success: true,
    message: parsed.message || "Review submitted",
    order: normalizeOrder(parsed.order),
  };
}
