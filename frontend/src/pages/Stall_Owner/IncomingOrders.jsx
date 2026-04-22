import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName } from "../../utils/appData";
import { fetchOrdersByStall } from "../../utils/orderApi";
import { resolveStallForOwner } from "../../utils/stallApi";

export default function IncomingOrders() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [stall, setStall] = useState(null);
  const [stallLoading, setStallLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (!stall?.id && !stall?._id) {
        if (isMounted) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const result = await fetchOrdersByStall(String(stall._id || stall.id));
        if (isMounted) {
          setOrders(Array.isArray(result?.orders) ? result.orders : []);
          setSubmitError("");
          setLastSyncedAt(new Date());
        }
      } catch (error) {
        if (isMounted) {
          setOrders([]);
          setSubmitError(error.message || "Failed to load incoming orders");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();
  const intervalId = setInterval(loadOrders, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [stall?.id, stall?._id]);

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
          <li className="active"><Link to="/incoming-orders">View Incoming Orders</Link></li>
          <li><Link to="/update-order">Update Order Status</Link></li>
          <li><Link to="/sales-summary">Sales Summary</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <h2>Incoming Orders</h2>
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
          <h3>{`Incoming Orders (${orders.length})`}</h3>
          {submitError && <p className="field-error">{submitError}</p>}
          {loading && <p className="sub-text">Loading incoming orders...</p>}

          <table>
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>STUDENT</th>
                <th>ITEMS</th>
                <th>QTY</th>
                <th>PICKUP TIME</th>
                <th>STATUS</th>
                <th>TOTAL</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.studentName}</td>
                  <td>{order.items.map((item) => `${item.itemName || item.name} x${item.quantity}`).join(", ")}</td>
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
                  <td>{`Rs. ${Number(order.totalAmount || 0).toFixed(2)}`}</td>
                </tr>
              ))}

              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan="7">No incoming orders right now.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
