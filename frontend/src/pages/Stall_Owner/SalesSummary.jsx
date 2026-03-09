import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
export default function SalesSummary() {
    const navigate = useNavigate();
    const handleLogout = () => {
  // Optional: remove login data
  localStorage.removeItem("user");

  // Redirect to login page
  navigate("/");
};
  return (
    
    <div className="dashboard-container">

      {/* Sidebar */}
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


      {/* MAIN */}
      <main className="main">

        {/* Header */}
        <div className="header">
          <div>
            <p className="back-link">← Back to Dashboard</p>
            <h2>Sales Summary</h2>
            <span className="sub-text">
              Track your stall's performance and revenue
            </span>
          </div>

          <div className="user-box">
            <div className="user-details">
              <p>South Indian Stall</p>
              <span>Owner: Ravi Kumar</span>
            </div>

            <button className="logout" onClick={handleLogout}>
                Logout
                </button>
          </div>
        </div>


        {/* Filter */}
        <div className="sales-filter">
          <select>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>

          <button className="export-btn">Export Report</button>
        </div>


        {/* Stats Cards */}
        <div className="sales-stats">

          <div className="sales-card">
            <p>Today's Orders</p>
            <h2>169</h2>
            <span className="green-text">↑ 12% from yesterday</span>
          </div>

          <div className="sales-card">
            <p>Today's Revenue</p>
            <h2 className="green">₹13,260</h2>
            <span className="green-text">↑ 8% from yesterday</span>
          </div>

          <div className="sales-card">
            <p>Avg Order Value</p>
            <h2 className="purple">₹78</h2>
            <span className="red-text">↓ 3% from yesterday</span>
          </div>

          <div className="sales-card">
            <p>Items Sold</p>
            <h2 className="orange">394</h2>
            <span className="green-text">↑ 15% from yesterday</span>
          </div>

        </div>


        {/* Charts Section */}
        <div className="sales-grid">

          {/* Hourly Sales */}
          <div className="sales-box">

            <h3>Hourly Sales Today</h3>

            <div className="progress-row">
              <span>08:00 AM</span>
              <div className="progress-bar"><div style={{width:"40%"}}></div></div>
              <small>12 orders · ₹850</small>
            </div>

            <div className="progress-row">
              <span>09:00 AM</span>
              <div className="progress-bar"><div style={{width:"60%"}}></div></div>
              <small>18 orders · ₹1240</small>
            </div>

            <div className="progress-row">
              <span>10:00 AM</span>
              <div className="progress-bar"><div style={{width:"70%"}}></div></div>
              <small>24 orders · ₹1680</small>
            </div>

            <div className="progress-row">
              <span>11:00 AM</span>
              <div className="progress-bar"><div style={{width:"85%"}}></div></div>
              <small>35 orders · ₹2450</small>
            </div>

            <div className="progress-row">
              <span>12:00 PM</span>
              <div className="progress-bar"><div style={{width:"95%"}}></div></div>
              <small>42 orders · ₹3150</small>
            </div>

          </div>


          {/* Top Selling */}
          <div className="sales-box">

            <h3>Top Selling Items</h3>

            <ul className="top-items">

              <li>
                <span className="rank">1</span>
                <div>
                  <strong>Masala Dosa</strong>
                  <p>124 sold</p>
                </div>
                <span className="price">₹6200</span>
              </li>

              <li>
                <span className="rank">2</span>
                <div>
                  <strong>Idli Sambar</strong>
                  <p>98 sold</p>
                </div>
                <span className="price">₹3920</span>
              </li>

              <li>
                <span className="rank">3</span>
                <div>
                  <strong>Vada Sambar</strong>
                  <p>76 sold</p>
                </div>
                <span className="price">₹2660</span>
              </li>

              <li>
                <span className="rank">4</span>
                <div>
                  <strong>Uttapam</strong>
                  <p>54 sold</p>
                </div>
                <span className="price">₹2970</span>
              </li>

              <li>
                <span className="rank">5</span>
                <div>
                  <strong>Upma</strong>
                  <p>42 sold</p>
                </div>
                <span className="price">₹1260</span>
              </li>

            </ul>

          </div>

        </div>


        {/* Monthly Overview */}
        <div className="monthly-overview">

          <h3>Monthly Overview (January 2026)</h3>

          <div className="monthly-cards">

            <div className="month-card blue">
              <p>Total Orders</p>
              <h2>3,567</h2>
            </div>

            <div className="month-card green">
              <p>Total Revenue</p>
              <h2>₹2,78,430</h2>
            </div>

            <div className="month-card purple">
              <p>Avg Daily Sales</p>
              <h2>₹16,378</h2>
            </div>

            <div className="month-card orange">
              <p>Items Sold</p>
              <h2>8,234</h2>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}