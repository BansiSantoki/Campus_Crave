
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="logo">CampusCrave</h2>

      <NavLink to="/admin" end className="nav-item">
        Dashboard
      </NavLink>

      <NavLink to="/manage-students" className="nav-item">
        Manage Students
      </NavLink>

      <NavLink to="/manage-stall-owners" className="nav-item">
        Manage Stall Owners
      </NavLink>

      <NavLink to="/manage-stalls" className="nav-item">
        Manage Stalls
      </NavLink>

      <NavLink to="/view-reports" className="nav-item">
        View Reports
      </NavLink>
    </div>
  );
}