import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName, getCart } from "../../utils/appData";
import { fetchAllOrders } from "../../utils/orderApi";
import { fetchAllStalls } from "../../utils/stallApi";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const displayName = getDisplayName(currentUser);
   const cartCount = getCart(currentUser).reduce(
     (sum, item) => sum + Number(item.quantity || 0),
     0
   );

  const [orders, setOrders] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const [orderResult, stallResult] = await Promise.all([
          fetchAllOrders(),
          fetchAllStalls(),
        ]);

        if (!isMounted) return;
        setOrders(Array.isArray(orderResult?.orders) ? orderResult.orders : []);
        setStalls(Array.isArray(stallResult) ? stallResult : []);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    const intervalId = setInterval(loadDashboard, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => ["New", "Preparing"].includes(order.status)).length;
    const readyOrders = orders.filter((order) => order.status === "Ready").length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const todayKey = new Date().toDateString();
    const todayRevenue = orders
      .filter((order) => new Date(order.createdAt || Date.now()).toDateString() === todayKey)
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      readyOrders,
      totalStalls: stalls.length,
      totalRevenue,
      todayRevenue,
    };
  }, [orders, stalls.length]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [orders],
  );

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="brand">
          <div className="brand-logo">CC</div>
          <div>
            <h3>CampusCrave</h3>
            <p>Student Portal</p>
          </div>
        </div>

        <ul className="nav-links">
          <li className="active"><Link to="/student">Dashboard</Link></li>
          <li><Link to="/stalls">View Stalls</Link></li>
          <li><Link to="/menu">Browse Menu</Link></li>
           <li><Link to="/cart">View Cart ({cartCount})</Link></li>
          <li><Link to="/orders">My Orders</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
      </div>

      <div className="main">
        <div className="header">
          <h2>{`Welcome, ${displayName}!`}</h2>

          <div className="user-box">
            <div className="user-details">
              <p>{displayName}</p>
              <span>{currentUser?.studentId ? `Student ID: ${currentUser.studentId}` : currentUser?.email || "Student"}</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="cards">
          <div className="stat-card">
            <p>All Orders</p>
            <h1>{stats.totalOrders}</h1>
          </div>

          <div className="stat-card pending">
            <p>Pending Orders</p>
            <h1>{stats.pendingOrders}</h1>
          </div>

          <div className="stat-card ready">
            <p>Live Revenue</p>
            <h1>{`Rs. ${stats.totalRevenue.toFixed(2)}`}</h1>
          </div>

          <div className="stat-card">
            <p>Today Revenue</p>
            <h1>{`Rs. ${stats.todayRevenue.toFixed(2)}`}</h1>
          </div>

          <div className="stat-card ready">
            <p>Open Stalls</p>
            <h1>{stats.totalStalls}</h1>
          </div>
        </div>

        <div className="orders-box">
          <h3>Recent Orders (All Users)</h3>
          {loading && <p className="sub-text">Loading dashboard...</p>}

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>STALL</th>
                  <th>ITEMS</th>
                  <th>AMOUNT</th>
                  <th>PICKUP TIME</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.stallName || "Campus Stall"}</td>
                    <td>{order.items.slice(0, 2).map((item) => `${item.itemName || item.name} x${item.quantity}`).join(", ")}</td>
                    <td>{`Rs. ${Number(order.totalAmount || 0).toFixed(2)}`}</td>
                    <td>{order.pickupTime || "-"}</td>
                    <td>
                      <span
                        className={`badge ${
                          order.status === "Ready"
                            ? "green"
                            : order.status === "New" || order.status === "Preparing"
                            ? "orange"
                            : "gray"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td><button className="btn-view" onClick={() => navigate("/orders")}>View Details</button></td>
                  </tr>
                ))}

                {!loading && recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="7">No orders yet. Start by browsing stalls and adding food to your cart.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="sub-text" style={{ marginTop: "12px" }}>{`Ready Orders: ${stats.readyOrders}`}</p>
        </div>
      </div>
    </div>
  );
}