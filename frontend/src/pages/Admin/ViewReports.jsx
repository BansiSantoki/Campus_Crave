import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName } from "../../utils/appData";
import { fetchAllOrders } from "../../utils/orderApi";
import { fetchRegistrations } from "../../utils/authApi";
import { fetchAllStalls } from "../../utils/stallApi";
import { fetchActivityLog } from "../../utils/activityApi";
import { formatCurrency, getOrderSummary, getStallSummaries } from "../../utils/orderInsights";

export default function ViewReports() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const adminName = getDisplayName(currentUser);

  const [orders, setOrders] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportRange, setReportRange] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const loadReportsData = async () => {
      setLoading(true);
      const [ordersResult, registrationsResult, stallsResult, activitiesResult] = await Promise.allSettled([
        fetchAllOrders(),
        fetchRegistrations(),
        fetchAllStalls(),
        fetchActivityLog(25),
      ]);

      if (!isMounted) return;

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
    };

    loadReportsData();
    const intervalId = setInterval(loadReportsData, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const now = new Date();

    if (reportRange === "today") {
      return orders.filter(
        (order) => new Date(order.createdAt).toDateString() === now.toDateString(),
      );
    }

    if (reportRange === "week") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      return orders.filter((order) => new Date(order.createdAt) >= weekStart);
    }

    if (reportRange === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return orders.filter((order) => new Date(order.createdAt) >= monthStart);
    }

    return orders;
  }, [orders, reportRange]);

  const summary = useMemo(() => getOrderSummary(filteredOrders), [filteredOrders]);
  const stallSummaries = useMemo(
    () => getStallSummaries(filteredOrders, stalls).slice(0, 8),
    [filteredOrders, stalls],
  );

  const reportRows = useMemo(() => {
    const grouped = filteredOrders.reduce((acc, order) => {
      const key = new Date(order.createdAt).toLocaleDateString();
      if (!acc[key]) {
        acc[key] = {
          date: key,
          orders: 0,
          revenue: 0,
          items: 0,
          ready: 0,
          pending: 0,
        };
      }

      acc[key].orders += 1;
      acc[key].revenue += Number(order.totalAmount || 0);
      acc[key].items += Number(order.totalItems || order.qty || 0);
      acc[key].ready += order.status === "Ready" ? 1 : 0;
      acc[key].pending += ["New", "Preparing"].includes(order.status) ? 1 : 0;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredOrders]);

  const chartRows = useMemo(() => reportRows.slice(0, 7).reverse(), [reportRows]);
  const chartMaxRevenue = useMemo(
    () => Math.max(1, ...chartRows.map((row) => Number(row.revenue || 0))),
    [chartRows],
  );
  const chartRevenuePoints = useMemo(() => {
    const width = 680;
    const height = 210;
    if (chartRows.length === 0) return "";

    return chartRows
      .map((row, index) => {
        const x = chartRows.length === 1 ? 340 : 10 + (index / (chartRows.length - 1)) * width;
        const y = 230 - (Number(row.revenue || 0) / chartMaxRevenue) * height;
        return `${x},${Math.max(8, y)}`;
      })
      .join(" ");
  }, [chartRows, chartMaxRevenue]);

  const studentCount = registrations.filter((user) => user.role === "student").length;
  const stallOwnerCount = registrations.filter((user) => user.role === "stall").length;

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

          <li>
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
            <Link to="/manage-categories">Manage Categories</Link>
          </li>

          <li className="active">
            <Link to="/view-reports">View Reports</Link>
          </li>

        </ul>

      </aside>



      {/* MAIN CONTENT */}
      <main className="main">

        {/* Header */}
        <div className="header">

          <div className="header-title">
            <h2>View Reports</h2>
          </div>

          <div className="user-box">

            <div className="user-details">
              <p>{adminName}</p>
              <span>System Administrator</span>
            </div>

            <button className="logout" onClick={handleLogout}>
              Logout
            </button>

          </div>

        </div>


        <div className="table-filters" style={{ marginBottom: "18px" }}>
          <select value={reportRange} onChange={(e) => setReportRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">Last 7 Days</option>
            <option value="today">Today</option>
          </select>
          {loading && <span className="status-chip">Generating reports...</span>}
        </div>

        <div className="admin-cards">
          <div className="admin-card">
            <p>Report Orders</p>
            <h2>{summary.totalOrders}</h2>
          </div>
          <div className="admin-card green">
            <p>Report Revenue</p>
            <h2>{formatCurrency(summary.totalRevenue)}</h2>
          </div>
          <div className="admin-card orange">
            <p>Total Students</p>
            <h2>{studentCount}</h2>
          </div>
          <div className="admin-card">
            <p>Stall Owners</p>
            <h2>{stallOwnerCount}</h2>
          </div>
          <div className="admin-card purple">
            <p>Active Stalls</p>
            <h2>{stalls.filter((stall) => stall.status === "Active").length}</h2>
          </div>
          <div className="admin-card">
            <p>Items Sold</p>
            <h2>{summary.totalItems}</h2>
          </div>
          <div className="admin-card green">
            <p>Bills Generated</p>
            <h2>{summary.generatedBillCount}</h2>
          </div>
        </div>

        <div className="sales-grid" style={{ marginTop: "24px" }}>
          <div className="sales-box">
            <h3>Status Distribution</h3>
            <div className="mini-status-list">
              <div className="mini-status-item"><span>New</span><strong>{summary.newOrders}</strong></div>
              <div className="mini-status-item"><span>Prepared</span><strong>{summary.preparingOrders}</strong></div>
              <div className="mini-status-item"><span>Ready</span><strong>{summary.readyOrders}</strong></div>
              <div className="mini-status-item"><span>Completed</span><strong>{summary.completedOrders}</strong></div>
              <div className="mini-status-item"><span>Cancelled</span><strong>{summary.cancelledOrders}</strong></div>
            </div>
          </div>

          <div className="sales-box">
            <h3>Top Stall Performance</h3>
            <ul className="top-items">
              {stallSummaries.map((stall, index) => (
                <li key={stall.stallId || `${stall.stallName}-${index}`}>
                  <span className="rank">{index + 1}</span>
                  <div>
                    <strong>{stall.stallName}</strong>
                    <p>{`${stall.orderCount} orders · ${stall.totalItems} items`}</p>
                  </div>
                  <span className="price">{formatCurrency(stall.revenue)}</span>
                </li>
              ))}
              {stallSummaries.length === 0 && <li>No stall data for selected report range.</li>}
            </ul>
          </div>
        </div>

        <div className="orders-box" style={{ marginTop: "24px" }}>
          <div className="panel-head">
            <h3>Daily Revenue Graph</h3>
            <span className="status-chip">Last {chartRows.length || 0} active days</span>
          </div>

          {chartRows.length > 0 ? (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <svg viewBox="0 0 700 280" width="100%" height="280" role="img" aria-label="Daily revenue chart">
                <rect x="0" y="0" width="700" height="280" fill="#f6fbf8" rx="10" />
                <line x1="10" y1="230" x2="690" y2="230" stroke="#d2e6d9" strokeWidth="1.5" />
                <line x1="20" y1="20" x2="20" y2="230" stroke="#d2e6d9" strokeWidth="1.5" />
                <polyline
                  fill="none"
                  stroke="#0f8f57"
                  strokeWidth="3"
                  points={chartRevenuePoints}
                />

                {chartRows.map((row, index) => {
                  const x = chartRows.length === 1 ? 340 : 10 + (index / (chartRows.length - 1)) * 680;
                  const y = 230 - (Number(row.revenue || 0) / chartMaxRevenue) * 210;

                  return (
                    <g key={row.date}>
                      <circle cx={x} cy={Math.max(20, y)} r="4" fill="#22b573" />
                      <text x={x} y="248" textAnchor="middle" fontSize="10" fill="#38624d">
                        {row.date}
                      </text>
                      <text x={x} y={Math.max(16, y - 8)} textAnchor="middle" fontSize="10" fill="#0f8f57">
                        {Math.round(Number(row.revenue || 0))}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <p className="sub-text">No data available for graph.</p>
          )}
        </div>

        <div className="orders-box" style={{ marginTop: "24px" }}>
          <div className="panel-head">
            <h3>Daily Report Table</h3>
            <span className="status-chip">{reportRows.length} day entries</span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>ORDERS</th>
                  <th>ITEMS</th>
                  <th>REVENUE</th>
                  <th>READY</th>
                  <th>PENDING</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{row.orders}</td>
                    <td>{row.items}</td>
                    <td>{formatCurrency(row.revenue)}</td>
                    <td>{row.ready}</td>
                    <td>{row.pending}</td>
                  </tr>
                ))}
                {reportRows.length === 0 && (
                  <tr>
                    <td colSpan="6">No report data available for selected range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="orders-box" style={{ marginTop: "24px" }}>
          <div className="panel-head">
            <h3>Live Activity Report</h3>
            <span className="status-chip">Updated continuously</span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>ACTIVITY</th>
                  <th>ENTITY</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity._id}>
                    <td>{new Date(activity.createdAt).toLocaleString()}</td>
                    <td>{activity.action.replace(/_/g, " ")}</td>
                    <td>{activity.entityName || activity.entityType}</td>
                    <td>{activity.details || "-"}</td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan="4">No live activities available yet.</td>
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