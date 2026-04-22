import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate} from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  getDisplayName
} from "../../utils/appData";
import { fetchAllOrders } from "../../utils/orderApi";
import { fetchRegistrations } from "../../utils/authApi";
import { fetchAllStalls } from "../../utils/stallApi";
import { fetchActivityLog } from "../../utils/activityApi";
import {
  formatCurrency,
  getOrderStatusLabel,
  getOrderStatusTone,
  getOrderSummary,
  getStallSummaries,
  getTopItems,
} from "../../utils/orderInsights";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const currentUser = getCurrentUser();
  const adminName = getDisplayName(currentUser);
  const [stalls, setStalls] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      const [ordersResult, registrationsResult, stallsResult, activitiesResult] = await Promise.allSettled([
        fetchAllOrders(),
        fetchRegistrations(),
        fetchAllStalls(),
        fetchActivityLog(20),
      ]);

      if (isMounted) {
        if (ordersResult.status === "fulfilled") {
          setOrders(ordersResult.value.orders || []);
        }

        if (registrationsResult.status === "fulfilled") {
          setRegistrations(registrationsResult.value || []);
        }

        if (stallsResult.status === "fulfilled") {
          setStalls(stallsResult.value || []);
        }

        if (activitiesResult.status === "fulfilled") {
          setActivities(activitiesResult.value || []);
        }

        setLoading(false);
      }
    };

    loadDashboardData();
    const intervalId = setInterval(loadDashboardData, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const studentCount = registrations.filter((user) => user.role === "student").length;
  const stallOwnerCount = registrations.filter((user) => user.role === "stall").length;
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    [orders]
  );
  const summary = useMemo(() => getOrderSummary(orders), [orders]);
  const topItems = useMemo(() => getTopItems(orders, 5), [orders]);
  const stallSummaries = useMemo(() => getStallSummaries(orders, stalls), [orders, stalls]);

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };
  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <aside className="sidebar admin-sidebar">
        <div className="brand">
          <div className="brand-logo">CC</div>
          <div>
            <h3>CampusCrave</h3>
            <p>Admin Portal</p>
          </div>
        </div>

        <ul className="nav-links">
          <li className="active">
            <Link to="/admin">Dashboard</Link>
          </li>

          <li>
            <Link to="/manage-students">Manage Students</Link>
          </li>

          <li>
            <Link to="/manage-stall-owners">Manage Stall Owners</Link>
          </li>

          <li>
            <Link to="/manage-stalls">Manage Stalls</Link>
          </li>

          <li>
            <Link to="/view-reports">View Reports</Link>
          </li>
        </ul>
      </aside>

      {/* MAIN */}
      <main className="main">

        {/* Header */}
        <div className="header">
          <h2>Admin Dashboard</h2>

          <div className="user-box">
            <div className="user-details">
              <p>{adminName}</p>
              <span>System Administrator</span>
            </div>

            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>


        {/* Dashboard Cards */}
        <div className="admin-cards">

          <div className="admin-card">
            <p>Total Students</p>
            <h2>{studentCount}</h2>
          </div>

          <div className="admin-card orange">
            <p>Total Stalls</p>
            <h2>{stalls.length}</h2>
          </div>

          <div className="admin-card">
            <p>Stall Owners</p>
            <h2>{stallOwnerCount}</h2>
          </div>

          <div className="admin-card purple">
            <p>Total Orders</p>
            <h2>{summary.totalOrders}</h2>
          </div>

          <div className="admin-card green">
            <p>Total Revenue</p>
            <h2>{formatCurrency(totalRevenue)}</h2>
          </div>

          <div className="admin-card orange">
            <p>Total Items Ordered</p>
            <h2>{summary.totalItems}</h2>
          </div>

          <div className="admin-card">
            <p>Order Mix</p>
            <h2>{`${summary.newOrders}/${summary.preparingOrders}/${summary.readyOrders}`}</h2>
          </div>

        </div>

        <div className="sales-grid" style={{ marginTop: "24px" }}>
          <div className="sales-box">
            <h3>Top Ordered Items</h3>
            <ul className="top-items">
              {topItems.map((item, index) => (
                <li key={item.name}>
                  <span className="rank">{index + 1}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{`${item.qty} ordered`}</p>
                  </div>
                  <span className="price">{formatCurrency(item.revenue)}</span>
                </li>
              ))}
              {topItems.length === 0 && <li>No item sales available yet.</li>}
            </ul>
          </div>

          <div className="sales-box">
            <h3>Status Overview</h3>
            <div className="mini-status-list">
              <div className="mini-status-item"><span>New</span><strong>{summary.newOrders}</strong></div>
              <div className="mini-status-item"><span>Prepared</span><strong>{summary.preparingOrders}</strong></div>
              <div className="mini-status-item"><span>Ready</span><strong>{summary.readyOrders}</strong></div>
              <div className="mini-status-item"><span>Completed</span><strong>{summary.completedOrders}</strong></div>
              <div className="mini-status-item"><span>WhatsApp Sent</span><strong>{summary.whatsappSentCount}</strong></div>
            </div>
          </div>
        </div>

        <div className="orders-box" style={{ marginTop: "24px" }}>
          <div className="panel-head">
            <h3>Recent Orders (Students + Stall Owners)</h3>
            {loading && <span className="status-chip">Syncing...</span>}
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>STUDENT</th>
                  <th>STALL</th>
                  <th>STALL OWNER</th>
                  <th>ITEMS</th>
                  <th>QTY</th>
                  <th>AMOUNT</th>
                  <th>PAYMENT</th>
                  <th>WHATSAPP</th>
                  <th>STATUS</th>
                  <th>PLACED AT</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 12).map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <div>{order.studentName || order.studentEmail || order.studentId || "Unknown Student"}</div>
                      <small className="sub-text">{order.studentEmail || order.studentId}</small>
                    </td>
                    <td>{order.stallName}</td>
                    <td>{order.stallOwner}</td>
                    <td>{order.items.map((item) => `${item.itemName || item.name} x${item.quantity}`).join(", ")}</td>
                    <td>{order.totalItems || order.qty}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`badge ${order.paymentStatus === "Completed" ? "green" : order.paymentStatus === "Failed" ? "red" : "blue"}`}>
                        {order.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${order.whatsappSent ? "green" : "red"}`}>
                        {order.whatsappSent ? "Sent" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getOrderStatusTone(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="11">No orders have been placed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="orders-box" style={{ marginTop: "24px" }}>
          <div className="panel-head">
            <h3>Stall Performance Summary</h3>
            <span className="status-chip">{stallSummaries.length} stalls tracked</span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>STALL</th>
                  <th>OWNER</th>
                  <th>ORDERS</th>
                  <th>ITEMS</th>
                  <th>REVENUE</th>
                  <th>NEW</th>
                  <th>PREPARED</th>
                  <th>READY</th>
                </tr>
              </thead>
              <tbody>
                {stallSummaries.map((stallSummary) => (
                  <tr key={stallSummary.stallId}>
                    <td>{stallSummary.stallName}</td>
                    <td>{stallSummary.stallOwner}</td>
                    <td>{stallSummary.orderCount}</td>
                    <td>{stallSummary.totalItems}</td>
                    <td>{formatCurrency(stallSummary.revenue)}</td>
                    <td>{stallSummary.newOrders}</td>
                    <td>{stallSummary.preparingOrders}</td>
                    <td>{stallSummary.readyOrders}</td>
                  </tr>
                ))}
                {stallSummaries.length === 0 && (
                  <tr>
                    <td colSpan="8">No stall summary data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="orders-box" style={{ marginTop: "24px" }}>
          <div className="panel-head">
            <h3>Live Activity Feed</h3>
            <span className="status-chip">{activities.length} recent events</span>
          </div>

          <ul className="top-items">
            {activities.map((activity) => (
              <li key={activity._id}>
                <span className="rank">{new Date(activity.createdAt).getDate()}</span>
                <div>
                  <strong>{activity.action.replace(/_/g, " ")}</strong>
                  <p>{activity.details || activity.entityName || activity.entityType}</p>
                </div>
                <span className="price">{new Date(activity.createdAt).toLocaleTimeString()}</span>
              </li>
            ))}
            {activities.length === 0 && <li>No live activity recorded yet.</li>}
          </ul>
        </div>

      </main>
    </div>
  );
}