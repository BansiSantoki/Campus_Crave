import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  getDisplayName,
  getCart,
} from "../utils/appData";

export default function StudentLayout() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const displayName = getDisplayName(currentUser);
  const cartCount = getCart(currentUser).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const handleLogout = () => {
    clearCurrentUser();
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
          <li>
            <Link to="/student">Dashboard</Link>
          </li>
          <li>
            <Link to="/stalls">View Stalls</Link>
          </li>
          <li>
            <Link to="/menu">Browse Menu</Link>
          </li>
          <li>
            <Link to="/cart">View Cart ({cartCount})</Link>
          </li>
          <li>
            <Link to="/orders">My Orders</Link>
          </li>
          <li>
            <Link to="/profile">Profile</Link>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main">
        {/* Header */}
        <div className="header">
          <div className="user-box">
            <div className="user-details">
              <p>{displayName}</p>
              <span>Student ID: {currentUser?.studentId || "N/A"}</span>
            </div>
            <button className="logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  );
}
