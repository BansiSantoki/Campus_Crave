import { Link, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="admin-container">
      <div className="sidebar">
        <h2 className="logo">CampusCrave</h2>

        <Link to="/admin">Dashboard</Link>
        <Link to="/manage-students">Manage Students</Link>
        <Link to="/manage-stall-owners">Manage Stall Owners</Link>
        <Link to="/manage-stalls">Manage Stalls</Link>
        <Link to="/view-reports">View Reports</Link>
      </div>

      <div className="main-content">
        <div className="topbar">
          <span>Admin User</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <Outlet />
      </div>
    </div>
  );
}