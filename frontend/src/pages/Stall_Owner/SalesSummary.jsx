import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName } from "../../utils/appData";
import { fetchOrdersByStall } from "../../utils/orderApi";
import { resolveStallForOwner } from "../../utils/stallApi";

export default function SalesSummary() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [stall, setStall] = useState(null);
  const [stallLoading, setStallLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

      setLoading(true);
      const result = await fetchOrdersByStall(String(stall._id || stall.id));
      if (isMounted) {
        setOrders(Array.isArray(result?.orders) ? result.orders : []);
        setLastSyncedAt(new Date());
        setLoading(false);
      }
    };

    loadOrders();
    const intervalId = setInterval(loadOrders, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [stall?.id, stall?._id]);

  const report = useMemo(() => {
    const now = new Date();
    const todayOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt || Date.now());
      return createdAt.toDateString() === now.toDateString();
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const totalItemsSold = orders.reduce((sum, order) => sum + Number(order.totalItems || order.qty || 0), 0);
    const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

    const itemMap = new Map();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemName = item.itemName || item.name || "Menu Item";
        const current = itemMap.get(itemName) || { quantity: 0, revenue: 0 };
        const quantity = Number(item.quantity || 0);
        const revenue = Number(item.totalPrice || Number(item.price || 0) * quantity);
        itemMap.set(itemName, {
          quantity: current.quantity + quantity,
          revenue: current.revenue + revenue,
        });
      });
    });

    const topItems = [...itemMap.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      avgOrderValue,
      totalItemsSold,
      totalOrders: orders.length,
      totalRevenue,
      topItems,
    };
  }, [orders]);

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
          <li><Link to="/update-order">Update Order Status</Link></li>
          <li className="active"><Link to="/sales-summary">Sales Summary</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <p className="back-link">← Back to Dashboard</p>
            <h2>Sales Summary</h2>
            <span className="sub-text">
              {lastSyncedAt
                ? `Track your stall performance - live sync ${lastSyncedAt.toLocaleTimeString()}`
                : "Track your stall's performance and revenue"}
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

        {loading && <p className="sub-text">Loading sales data...</p>}

        <div className="sales-stats">
          <div className="sales-card">
            <p>Today's Orders</p>
            <h2>{report.todayOrders}</h2>
            <span className="green-text">Live from current stall orders</span>
          </div>

          <div className="sales-card">
            <p>Today's Revenue</p>
            <h2 className="green">{`Rs. ${report.todayRevenue.toFixed(2)}`}</h2>
            <span className="green-text">Updated every few seconds</span>
          </div>

          <div className="sales-card">
            <p>Avg Order Value</p>
            <h2 className="purple">{`Rs. ${report.avgOrderValue.toFixed(2)}`}</h2>
            <span className="sub-text">Based on total completed + active orders</span>
          </div>

          <div className="sales-card">
            <p>Items Sold</p>
            <h2 className="orange">{report.totalItemsSold}</h2>
            <span className="green-text">Across all time</span>
          </div>
        </div>

        <div className="sales-grid">
          <div className="sales-box">
            <h3>Top Selling Items</h3>
            <ul className="top-items">
              {report.topItems.map((item, index) => (
                <li key={item.name}>
                  <span className="rank">{index + 1}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{`${item.quantity} sold`}</p>
                  </div>
                  <span className="price">{`Rs. ${item.revenue.toFixed(2)}`}</span>
                </li>
              ))}

              {report.topItems.length === 0 && <li>No items sold yet.</li>}
            </ul>
          </div>

          <div className="sales-box">
            <h3>Stall Overview</h3>
            <div className="progress-row">
              <span>Total Orders</span>
              <small>{report.totalOrders}</small>
            </div>
            <div className="progress-row">
              <span>Total Revenue</span>
              <small>{`Rs. ${report.totalRevenue.toFixed(2)}`}</small>
            </div>
            <div className="progress-row">
              <span>Today's Orders</span>
              <small>{report.todayOrders}</small>
            </div>
            <div className="progress-row">
              <span>Today's Revenue</span>
              <small>{`Rs. ${report.todayRevenue.toFixed(2)}`}</small>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
