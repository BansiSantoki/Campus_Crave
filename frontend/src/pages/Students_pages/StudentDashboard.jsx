import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
export default function StudentDashboard() {
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
      <div className="sidebar">
        <div className="brand">
          <div className="brand-logo">CC</div>
          <div>
            <h3>CampusCrave</h3>
            <p>Student Portal</p>
          </div>
        </div>

        <ul className="nav-links">
  <li className="active">
    <Link to="/student">Dashboard</Link>
  </li>

  <li>
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
      </div>

      {/* Main Section */}
      <div className="main">

        {/* Header */}
        <div className="header">
          <h2>Welcome, John!</h2>

          <div className="user-box">
            <div className="user-details">
              <p>John Doe</p>
              <span>Student ID: STU2024001</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Cards */}
        <div className="cards">
          <div className="stat-card">
            <p>Total Orders</p>
            <h1>24</h1>
          </div>

          <div className="stat-card pending">
            <p>Pending Orders</p>
            <h1>2</h1>
          </div>

          <div className="stat-card ready">
            <p>Ready Orders</p>
            <h1>1</h1>
          </div>
        </div>

        {/* Orders Table */}
        <div className="orders-box">
          <h3>Recent Orders</h3>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>ITEMS</th>
                  <th>AMOUNT</th>
                  <th>PICKUP TIME</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>ORD001</td>
                  <td>Veg Burger, Cold Coffee</td>
                  <td>₹150</td>
                  <td>11:30 AM</td>
                  <td><span className="badge green">Ready</span></td>
                  <td><button className="btn-view">View Details</button></td>
                </tr>

                <tr>
                  <td>ORD002</td>
                  <td>Masala Dosa, Tea</td>
                  <td>₹80</td>
                  <td>12:00 PM</td>
                  <td><span className="badge orange">Preparing</span></td>
                  <td><button className="btn-view">View Details</button></td>
                </tr>

                <tr>
                  <td>ORD003</td>
                  <td>Paneer Sandwich, Juice</td>
                  <td>₹120</td>
                  <td>10:45 AM</td>
                  <td><span className="badge gray">Completed</span></td>
                  <td><button className="btn-view">View Details</button></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}