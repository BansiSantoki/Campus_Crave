import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName } from "../../utils/appData";
import { fetchOrdersByStall, updateOrderStatusRequest } from "../../utils/orderApi";
import { resolveStallForOwner } from "../../utils/stallApi";

const ORDER_STATUS_OPTIONS = ["New", "Preparing", "Ready", "Completed", "Cancelled"];

export default function UpdateOrders() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [stall, setStall] = useState(null);
  const [stallLoading, setStallLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadAssignedStall = async () => {
      setStallLoading(true);
      const resolvedStall = await resolveStallForOwner(currentUser);
      if (!isMounted) {
        return;
      }
      setStall(resolvedStall || null);
      setStallLoading(false);
    };

    loadAssignedStall();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.email, currentUser?.stallName]);

  const loadOrders = async () => {
    if (!stall?.id && !stall?._id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await fetchOrdersByStall(String(stall._id || stall.id));
      setOrders(Array.isArray(result?.orders) ? result.orders : []);
      setSubmitError("");
      setLastSyncedAt(new Date());
    } catch (error) {
      setOrders([]);
      setSubmitError(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const intervalId = setInterval(loadOrders, 5000);
    return () => clearInterval(intervalId);
  }, [stall?.id, stall?._id]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      setUpdatingId(String(orderId));
      await updateOrderStatusRequest(orderId, status);
      await loadOrders();
      setSubmitError("");
    } catch (error) {
      setSubmitError(error.message || "Failed to update order status");
    } finally {
      setUpdatingId("");
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  const ownerName = getDisplayName(currentUser);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">CC</div>
          <div>
            <h3>CampusCrave</h3>
            <p>Stall Owner Portal</p>
          </div>
        </div>

        <ul className="nav-links">
          <li><Link to="/stall">Dashboard</Link></li>
          <li><Link to="/manage-menu">Manage Menu Items</Link></li>
          <li><Link to="/incoming-orders">View Incoming Orders</Link></li>
          <li className="active"><Link to="/update-order">Update Order Status</Link></li>
          <li><Link to="/sales-summary">Sales Summary</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <h2>Update Order Status</h2>
            <span className="sub-text">
              {lastSyncedAt ? `Live sync: ${lastSyncedAt.toLocaleTimeString()}` : "Live sync pending..."}
            </span>
          </div>

          <div className="user-box">
            <div className="user-details">
              <p>{stallLoading ? "Loading stall..." : stall?.stallName || "Assigned Stall"}</p>
              <span>{`Owner: ${ownerName}`}</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="orders-box">
          <h3>Status Management</h3>
          {submitError && <p className="field-error">{submitError}</p>}
          {loading && <p className="sub-text">Loading orders...</p>}

          <table>
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>STUDENT</th>
                <th>ITEMS</th>
                <th>CURRENT STATUS</th>
                <th>UPDATE STATUS</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.studentName}</td>
                  <td>{order.items.map((item) => `${item.itemName || item.name} x${item.quantity}`).join(", ")}</td>
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
                    <select
                      value={order.status}
                      disabled={updatingId === String(order.id)}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan="5">No orders available for status updates.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
