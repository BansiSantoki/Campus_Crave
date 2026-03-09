import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
export default function ViewStalls() {
   const navigate = useNavigate();
  
  const handleLogout = () => {
    // Optional: Clear localStorage or session
    localStorage.removeItem("user");
  
    // Redirect to login
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
            <p>Student Portal</p>
          </div>
        </div>

<ul className="nav-links">
  <li >
    <Link to="/student">Dashboard</Link>
  </li>

  <li className="active">
    <Link to="/stalls">View Stalls</Link>
  </li>

  <li>
    <Link to="/menu">Browse Menu</Link>
  </li>

  <li>
    <Link to="/orders">My Orders</Link>
  </li>

  <li>
    <Link to="/profile">Profile</Link>
  </li>
</ul>
      </aside>

      {/* MAIN */}
      <main className="main">

        <div className="header">
          <div>
            <p className="back-link">← Back to Dashboard</p>
            <h2>Campus Stalls</h2>
            <span className="sub-text">
              Browse all available food stalls on campus
            </span>
          </div>

          <div className="user-box">
            <div className="user-details">
              <p>John Doe</p>
              <span>Student ID: STU2024001</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Search Section */}
        <div className="stall-filter">
          <input type="text" placeholder="Search stalls..." />
          <div className="filter-buttons">
            <button>All Stalls</button>
            <button>Open Now</button>
            <button>Top Rated</button>
          </div>
        </div>

        {/* Stall Cards */}
        <div className="stall-grid">

          {/* Card 1 */}
          <div className="stall-card">
            <div className="stall-top">
              <h3>South Indian Stall</h3>
              <span className="open-badge">Open</span>
            </div>
            <p>Owner: Ravi Kumar</p>
            <p>⭐ 4.5 · 2340 orders</p>
            <p className="category-tag">South Indian</p>
            <p>⏰ 8:00 AM - 6:00 PM</p>

            <div className="specialties">
              <span>Dosa</span>
              <span>Idli</span>
              <span>Vada</span>
              <span>Uttapam</span>
            </div>

            <div className="stall-buttons">
              <button className="view-btn">View Menu</button>
              <button className="order-btn">Order Now</button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="stall-card">
            <div className="stall-top">
              <h3>North Indian Stall</h3>
              <span className="open-badge">Open</span>
            </div>
            <p>Owner: Priya Sharma</p>
            <p>⭐ 4.3 · 1890 orders</p>
            <p className="category-tag">North Indian</p>
            <p>⏰ 9:00 AM - 7:00 PM</p>

            <div className="specialties">
              <span>Chole Bhature</span>
              <span>Paratha</span>
              <span>Rajma Rice</span>
            </div>

            <div className="stall-buttons">
              <button className="view-btn">View Menu</button>
              <button className="order-btn">Order Now</button>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}