import { Link, useNavigate} from "react-router-dom";

export default function StallDashboard() {
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
          <li className="active"><Link to="/stall">Dashboard</Link></li>
          <li><Link to="/manage-menu">Manage Menu Items</Link></li>
          <li><Link to="/incoming-orders">View Incoming Orders</Link></li>
          <li><Link to="/update-order">Update Order Status</Link></li>
          <li><Link to="/sales-summary">Sales Summary</Link></li>
        </ul>
      </aside>


      {/* MAIN */}
      <main className="main">

        {/* Header */}
        <div className="header">
          <h2>Stall Dashboard</h2>

          <div className="user-box">
            <div className="user-details">
              <p>South Indian Stall</p>
              <span>Owner: Ravi Kumar</span>
            </div>

            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>


        {/* Stats Cards */}
        <div className="stall-cards">

          <div className="stall-stat-card">
            <p>Today's Orders</p>
            <h2>18</h2>
          </div>

          <div className="stall-stat-card new">
            <p>New Orders</p>
            <h2>4</h2>
          </div>

          <div className="stall-stat-card preparing">
            <p>Preparing</p>
            <h2>6</h2>
          </div>

          <div className="stall-stat-card revenue">
            <p>Today's Revenue</p>
            <h2>₹2,450</h2>
          </div>

        </div>


        {/* Orders Table */}
        <div className="orders-box">

          <h3>Incoming Orders</h3>

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

              <tr>
                <td>ORD001</td>
                <td>John Doe</td>
                <td>Veg Burger, Cold Coffee</td>
                <td>2</td>
                <td>11:30 AM</td>
                <td><span className="badge orange">Preparing</span></td>
                <td>
                  <button className="ready-btn">Mark Ready</button>
                </td>
              </tr>

              <tr>
                <td>ORD002</td>
                <td>Jane Smith</td>
                <td>Masala Dosa, Tea</td>
                <td>2</td>
                <td>12:00 PM</td>
                <td><span className="badge blue">New</span></td>
                <td>
                  <button className="prepare-btn">Start Preparing</button>
                </td>
              </tr>

              <tr>
                <td>ORD003</td>
                <td>Mike Johnson</td>
                <td>Paneer Sandwich, Juice</td>
                <td>2</td>
                <td>11:45 AM</td>
                <td><span className="badge orange">Preparing</span></td>
                <td>
                  <button className="ready-btn">Mark Ready</button>
                </td>
              </tr>

              <tr>
                <td>ORD004</td>
                <td>Sarah Williams</td>
                <td>Pasta, Soft Drink</td>
                <td>2</td>
                <td>12:15 PM</td>
                <td><span className="badge blue">New</span></td>
                <td>
                  <button className="prepare-btn">Start Preparing</button>
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </main>
    </div>
  );
}