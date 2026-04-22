import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearCurrentUser,
  ensureAppData,
  getCart,
  getCurrentUser,
  getDisplayName,
} from "../../utils/appData";
import {
  fetchOrdersByStudent,
  sendOrderBillWhatsAppRequest,
  submitOrderReviewRequest,
} from "../../utils/orderApi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Orders() {
  const navigate = useNavigate();
  ensureAppData();

  const currentUser = getCurrentUser();
  const displayName = getDisplayName(currentUser);
  const cartCount = getCart(currentUser).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const [studentOrders, setStudentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingOrderId, setSendingOrderId] = useState("");
  const [reviewingOrderId, setReviewingOrderId] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState({});

  const totals = useMemo(() => {
    const totalOrders = studentOrders.length;
    const pending = studentOrders.filter((order) => ["New", "Preparing"].includes(order.status)).length;
    const ready = studentOrders.filter((order) => order.status === "Ready").length;
    const spent = studentOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      totalOrders,
      pending,
      ready,
      spent,
    };
  }, [studentOrders]);

  const trackingGraph = useMemo(() => {
    const base = { New: 0, Preparing: 0, Ready: 0, Completed: 0, Cancelled: 0 };

    studentOrders.forEach((order) => {
      const status = String(order.status || order.orderStatus || "New").trim();
      if (base[status] !== undefined) {
        base[status] += 1;
      } else {
        base.New += 1;
      }
    });

    const maxValue = Math.max(...Object.values(base), 1);
    return Object.entries(base).map(([label, value]) => ({
      label,
      value,
      width: Math.max(6, Math.round((value / maxValue) * 100)),
    }));
  }, [studentOrders]);

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (!currentUser?.email) {
        if (isMounted) {
          setStudentOrders([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const result = await fetchOrdersByStudent(currentUser.email);
        if (isMounted) {
          setStudentOrders(result?.orders || []);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        if (isMounted) {
          setStudentOrders([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();
    const intervalId = setInterval(loadOrders, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [currentUser?.email]);

  const updateReviewDraft = (orderId, field, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [field]: value,
      },
    }));
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">CC</div>
          <div>
            <h3>CampusCrave</h3>
            <p>Student Portal</p>
          </div>
        </div>

        <ul className="nav-links">
          <li><Link to="/student">Dashboard</Link></li>
          <li><Link to="/stalls">View Stalls</Link></li>
          <li><Link to="/menu">Browse Menu</Link></li>
          <li><Link to="/cart">View Cart ({cartCount})</Link></li>
          <li className="active"><Link to="/orders">My Orders</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <Link className="back-link" to="/student">← Back to Dashboard</Link>
            <h2>My Orders</h2>
            <span className="sub-text">Track your placed orders and current status</span>
          </div>
          <div className="user-box">
            <div className="user-details">
              <p>{displayName}</p>
              <span>{currentUser?.studentId ? `Student ID: ${currentUser.studentId}` : currentUser?.email || "Student"}</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="admin-cards" style={{ marginBottom: "18px" }}>
          <div className="admin-card">
            <p>Total Orders</p>
            <h2>{totals.totalOrders}</h2>
          </div>
          <div className="admin-card orange">
            <p>Pending</p>
            <h2>{totals.pending}</h2>
          </div>
          <div className="admin-card green">
            <p>Ready</p>
            <h2>{totals.ready}</h2>
          </div>
          <div className="admin-card purple">
            <p>Total Spent</p>
            <h2>{`Rs. ${totals.spent.toFixed(2)}`}</h2>
          </div>
        </div>

        <div className="orders-box" style={{ marginBottom: "18px" }}>
          <div className="panel-head">
            <h3>Order Tracking Graph</h3>
            <span className="sub-text">Status distribution of your orders</span>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {trackingGraph.map((entry) => (
              <div key={entry.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong>{entry.label}</strong>
                  <span>{entry.value}</span>
                </div>
                <div style={{ background: "#e5f4ea", borderRadius: "999px", height: "12px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${entry.width}%`,
                      height: "100%",
                      background: entry.label === "Cancelled" ? "#ef4444" : entry.label === "Completed" ? "#64748b" : "#16a34a",
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="orders-box">
          <div className="panel-head">
            <h3>Order History ({studentOrders.length})</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {loading && <span className="status-chip">Syncing...</span>}
              <button className="view-btn" onClick={() => navigate("/cart")}>Go To Cart</button>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>STALL</th>
                  <th>ITEMS</th>
                  <th>TOTAL</th>
                  <th>PAYMENT</th>
                  <th>PICKUP TIME</th>
                  <th>STATUS</th>
                  <th>WHATSAPP</th>
                  <th>BILL</th>
                  <th>RATING & REVIEW</th>
                </tr>
              </thead>

              <tbody>
                {studentOrders.map((order) => {
                  const rowId = order.orderId || order.id;
                  return (
                    <tr key={rowId}>
                      <td>{rowId}</td>
                      <td>{order.stallName || "Campus Stall"}</td>
                      <td>{(order.items || []).map((item) => `${item.itemName || item.name} x${item.quantity}`).join(", ")}</td>
                      <td>{`Rs. ${Number(order.totalAmount || 0).toFixed(2)}`}</td>
                      <td>
                        <span className={`badge ${order.paymentStatus === "Completed" ? "green" : "orange"}`}>
                          {order.paymentStatus || "Pending"}
                        </span>
                      </td>
                      <td>{order.pickupTime || "-"}</td>
                      <td>
                        <span
                          className={`badge ${
                            order.status === "Ready"
                              ? "green"
                              : order.status === "Preparing" || order.status === "New"
                              ? "orange"
                              : "gray"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        {order.whatsappSent ? (
                          <span className="badge green">Sent</span>
                        ) : (
                          <div>
                            <span className="badge red">Pending</span>
                            {order.whatsappError && (
                              <div className="sub-text" style={{ marginTop: "6px", maxWidth: "180px", color: "#b04343" }}>
                                {order.whatsappError}
                              </div>
                            )}
                            <div style={{ marginTop: "6px" }}>
                              <button
                                className="view-btn"
                                disabled={sendingOrderId === String(rowId)}
                                onClick={async () => {
                                  setSendingOrderId(String(rowId));
                                    const result = await sendOrderBillWhatsAppRequest(rowId, order.studentPhone || currentUser?.phone || "");
                                  setSendingOrderId("");

                                  if (result.success) {
                                    alert(result.message || "WhatsApp bill sent");
                                    const refreshed = await fetchOrdersByStudent(currentUser?.email);
                                    setStudentOrders(refreshed.orders || []);
                                  } else {
                                    const message = String(result.message || "Failed to send WhatsApp bill");
                                    if (!message.toLowerCase().includes("twilio credentials are not configured")) {
                                      alert(message);
                                    }
                                  }
                                }}
                              >
                                {sendingOrderId === String(rowId) ? "Sending..." : "Retry"}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        {order.billPdfUrl ? (
                          <a
                            className="view-btn"
                            href={`${API_BASE}/orders/${encodeURIComponent(rowId)}/bill?t=${Date.now()}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download Bill
                          </a>
                        ) : (
                          <span className="sub-text">Pending</span>
                        )}
                      </td>
                      <td>
                        {order.studentRating > 0 ? (
                          <div>
                            <span className="badge green">{`★ ${order.studentRating}/5`}</span>
                            {order.studentReview && (
                              <div className="sub-text" style={{ marginTop: "6px", maxWidth: "220px" }}>
                                {order.studentReview}
                              </div>
                            )}
                          </div>
                        ) : ["Ready", "Completed"].includes(String(order.status || order.orderStatus || "")) ? (
                          <div style={{ display: "grid", gap: "6px", minWidth: "220px" }}>
                            <select
                              value={reviewDrafts[rowId]?.rating || ""}
                              onChange={(e) => updateReviewDraft(rowId, "rating", e.target.value)}
                            >
                              <option value="">Rate this order</option>
                              <option value="1">1 - Poor</option>
                              <option value="2">2 - Fair</option>
                              <option value="3">3 - Good</option>
                              <option value="4">4 - Very Good</option>
                              <option value="5">5 - Excellent</option>
                            </select>
                            <textarea
                              placeholder="Write a short review (optional)"
                              value={reviewDrafts[rowId]?.review || ""}
                              maxLength={500}
                              onChange={(e) => updateReviewDraft(rowId, "review", e.target.value)}
                              style={{ minHeight: "64px" }}
                            />
                            <button
                              className="view-btn"
                              disabled={reviewingOrderId === String(rowId)}
                              onClick={async () => {
                                const selectedRating = Number(reviewDrafts[rowId]?.rating || 0);
                                if (!selectedRating) {
                                  alert("Please select a rating between 1 and 5");
                                  return;
                                }

                                try {
                                  setReviewingOrderId(String(rowId));
                                  const response = await submitOrderReviewRequest(rowId, {
                                    rating: selectedRating,
                                    review: String(reviewDrafts[rowId]?.review || "").trim(),
                                  });

                                  if (response.success) {
                                    alert(response.message || "Review submitted successfully");
                                    const refreshed = await fetchOrdersByStudent(currentUser?.email);
                                    setStudentOrders(refreshed.orders || []);
                                  }
                                } catch (error) {
                                  alert(error?.message || "Failed to submit review");
                                } finally {
                                  setReviewingOrderId("");
                                }
                              }}
                            >
                              {reviewingOrderId === String(rowId) ? "Submitting..." : "Submit Review"}
                            </button>
                          </div>
                        ) : (
                          <span className="sub-text">Available after order is Ready/Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!loading && studentOrders.length === 0 && (
                  <tr>
                    <td colSpan="10">
                      No orders found. Add items to cart and place your first order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
