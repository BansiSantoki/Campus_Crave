import { Link } from "react-router-dom";

export default function RegisterChoice() {
  return (
    <div className="auth-wrapper auth-choice-wrapper">
      <div className="auth-card auth-choice-card">
        <div className="icon-circle">CC</div>
        <h2>Choose Registration Type</h2>
        <p className="sub-text">Create your CampusCrave account as a student or stall owner</p>

        <div className="register-choice-grid">
          <Link className="register-choice-card" to="/register/student">
            <h3>Student Registration</h3>
            <p>Join to browse menus, place orders, and track your food in real time.</p>
            <span>Continue as Student</span>
          </Link>

          <Link className="register-choice-card" to="/register/stall-owner">
            <h3>Stall Owner Registration</h3>
            <p>Set up your stall, manage menu items, and handle incoming campus orders.</p>
            <span>Continue as Stall Owner</span>
          </Link>
        </div>

        <p className="bottom-text">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
}
