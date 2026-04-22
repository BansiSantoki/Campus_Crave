import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName } from "../../utils/appData";
import { fetchOrdersByStall, updateOrderStatusRequest } from "../../utils/orderApi";
import { resolveStallForOwner } from "../../utils/stallApi";

export default function StallDashboard() {
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

  const stats = useMemo(() => {
    const todayKey = new Date().toDateString();
    const todayOrders = orders.filter(
      (order) => new Date(order.createdAt || Date.now()).toDateString() === todayKey,
    );
    const newOrders = orders.filter((order) => order.status === "New").length;
    const preparingOrders = orders.filter((order) => order.status === "Preparing").length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      todayOrders: todayOrders.length,
      newOrders,
      preparingOrders,
      todayRevenue,
    };
  }, [orders]);

  const handleUpdateStatus = async (order, nextStatus) => {
    try {
      const orderId = order.id || order.orderId;
      setUpdatingId(String(orderId));
      await updateOrderStatusRequest(orderId, nextStatus);
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
          <li className="active"><Link to="/stall">Dashboard</Link></li>
          <li><Link to="/manage-menu">Manage Menu Items</Link></li>
          <li><Link to="/incoming-orders">View Incoming Orders</Link></li>
          <li><Link to="/update-order">Update Order Status</Link></li>
          <li><Link to="/sales-summary">Sales Summary</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <h2>Stall Dashboard</h2>
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

        <div className="stall-cards">
          <div className="stall-stat-card">
            <p>Today's Orders</p>
            <h2>{stats.todayOrders}</h2>
          </div>

          <div className="stall-stat-card new">
            <p>New Orders</p>
            <h2>{stats.newOrders}</h2>
          </div>

          <div className="stall-stat-card preparing">
            <p>Preparing</p>
            <h2>{stats.preparingOrders}</h2>
          </div>

          <div className="stall-stat-card revenue">
            <p>Today's Revenue</p>
            <h2>{`Rs. ${stats.todayRevenue.toFixed(2)}`}</h2>
          </div>
        </div>

        <div className="orders-box">
          <h3>Incoming Orders</h3>
          {submitError && <p className="field-error">{submitError}</p>}
          {loading && <p className="sub-text">Loading orders...</p>}

          <table>
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>STUDENT</th>
                <th>ITEMS</th>
                <th>QTY</th>
                <th>PICKUP TIME</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {orders.slice(0, 8).map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.studentName}</td>
                  <td>{order.items.map((item) => item.itemName || item.name).join(", ")}</td>
                  <td>{order.totalItems || order.qty || 0}</td>
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
                    {order.status === "New" && (
                      <button
                        className="prepare-btn"
                        disabled={updatingId === String(order.id)}
                        onClick={() => handleUpdateStatus(order, "Preparing")}
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === "Preparing" && (
                      <button
                        className="ready-btn"
                        disabled={updatingId === String(order.id)}
                        onClick={() => handleUpdateStatus(order, "Ready")}
                      >
                        Mark Ready
                      </button>
                    )}
                    {(order.status === "Ready" || order.status === "Completed") && <span className="sub-text">No action</span>}
                  </td>
                </tr>
              ))}

              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan="7">No orders yet for this stall.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
