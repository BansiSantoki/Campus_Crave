import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    studentId: "STU2024001",
    email: "john.doe@college.edu",
    phone: "+91 98765 43210",
    department: "Computer Science",
    year: "First Year"
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

const handleLogout = () => {
  // Optional: Clear localStorage or session
  localStorage.removeItem("user");

  // Redirect to login
  navigate("/");
};

const handleProfileChange = (e) => {
  setProfile({ ...profile, [e.target.name]: e.target.value });
};

const validateProfile = () => {
  const newErrors = {};

  if (!profile.firstName.trim()) {
    newErrors.firstName = "First name is required";
  } else if (profile.firstName.length < 2) {
    newErrors.firstName = "First name must be at least 2 characters";
  }

  if (!profile.lastName.trim()) {
    newErrors.lastName = "Last name is required";
  } else if (profile.lastName.length < 2) {
    newErrors.lastName = "Last name must be at least 2 characters";
  }

  if (!profile.email.trim()) {
    newErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    newErrors.email = "Please enter a valid email";
  }

  if (!profile.phone.trim()) {
    newErrors.phone = "Phone number is required";
  } else if (!/^\d{10}$/.test(profile.phone.replace(/\D/g, ""))) {
    newErrors.phone = "Phone must be 10 digits";
  }

  return newErrors;
};

const handleSaveProfile = (e) => {
  e?.preventDefault();
  const newErrors = validateProfile();
  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    return;
  }

  alert("Profile updated successfully!");
};

const handlePasswordChange = (e) => {
  setPassword({ ...password, [e.target.name]: e.target.value });
};

const validatePassword = () => {
  const newErrors = {};

  if (!password.currentPassword) {
    newErrors.currentPassword = "Current password is required";
  }

  if (!password.newPassword) {
    newErrors.newPassword = "New password is required";
  } else if (password.newPassword.length < 8) {
    newErrors.newPassword = "Password must be at least 8 characters";
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.newPassword)) {
    newErrors.newPassword = "Must contain uppercase, lowercase, and numbers";
  }

  if (!password.confirmPassword) {
    newErrors.confirmPassword = "Please confirm your password";
  } else if (password.newPassword !== password.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match";
  }

  return newErrors;
};

const handleUpdatePassword = (e) => {
  e?.preventDefault();
  const newErrors = validatePassword();
  setPasswordErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    return;
  }

  alert("Password updated successfully!");
  setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
          <li><Link to="/student">Dashboard</Link></li>
          <li><Link to="/stalls">View Stalls</Link></li>
          <li><Link to="/menu">Browse Menu</Link></li>
          <li><Link to="/orders">My Orders</Link></li>
          <li className="active"><Link to="/profile">Profile</Link></li>
        </ul>
      </aside>

      {/* MAIN */}
      <main className="main">

        <div className="header">
          <div>
            <p className="back-link">← Back to Dashboard</p>
            <h2>My Profile</h2>
            <span className="sub-text">
              Manage your account settings and preferences
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

        <div className="profile-layout">

          {/* LEFT PROFILE CARD */}
          <div className="profile-card">
            <div className="avatar">JD</div>
            <h3>John Doe</h3>
            <p>STU2024001</p>
            <span>Computer Science</span>

            <div className="profile-stats">
              <div>
                <p>Total Orders</p>
                <strong>24</strong>
              </div>
              <div>
                <p>Member Since</p>
                <strong>Jan 2024</strong>
              </div>
              <div>
                <p>Total Spent</p>
                <strong>₹3,450</strong>
              </div>
            </div>

            <button className="upload-btn">Upload Photo</button>
          </div>

          {/* RIGHT SIDE */}
          <div className="profile-right">

            {/* Personal Info */}
            <div className="profile-box">
              <h3>Personal Information</h3>

              <div className="form-grid">
                <div>
                  <label>First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleProfileChange}
                    className={errors.firstName ? "input-error" : ""}
                  />
                  {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                </div>

                <div>
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleProfileChange}
                    className={errors.lastName ? "input-error" : ""}
                  />
                  {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                </div>
              </div>

              <label>Student ID</label>
              <input 
                type="text" 
                value={profile.studentId}
                disabled
              />

              <label>Email Address</label>
              <input 
                type="email" 
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}

              <label>Phone Number</label>
              <input 
                type="text" 
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className={errors.phone ? "input-error" : ""}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}

              <div className="form-grid">
                <div>
                  <label>Department</label>
                  <select 
                    name="department"
                    value={profile.department}
                    onChange={handleProfileChange}
                  >
                    <option>Computer Science</option>
                    <option>IT</option>
                  </select>
                </div>

                <div>
                  <label>Year</label>
                  <select 
                    name="year"
                    value={profile.year}
                    onChange={handleProfileChange}
                  >
                    <option>First Year</option>
                    <option>Second Year</option>
                  </select>
                </div>
              </div>

              <div className="form-buttons">
                <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
                <button className="cancel-btn" onClick={() => navigate("/student")}>Cancel</button>
              </div>
            </div>

            {/* Change Password */}
            <div className="profile-box">
              <h3>Change Password</h3>

              <label>Current Password</label>
              <input 
                type="password" 
                name="currentPassword"
                value={password.currentPassword}
                onChange={handlePasswordChange}
                className={passwordErrors.currentPassword ? "input-error" : ""}
              />
              {passwordErrors.currentPassword && <span className="field-error">{passwordErrors.currentPassword}</span>}

              <label>New Password</label>
              <input 
                type="password" 
                name="newPassword"
                value={password.newPassword}
                onChange={handlePasswordChange}
                className={passwordErrors.newPassword ? "input-error" : ""}
              />
              {passwordErrors.newPassword && <span className="field-error">{passwordErrors.newPassword}</span>}

              <label>Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={password.confirmPassword}
                onChange={handlePasswordChange}
                className={passwordErrors.confirmPassword ? "input-error" : ""}
              />
              {passwordErrors.confirmPassword && <span className="field-error">{passwordErrors.confirmPassword}</span>}

              <button className="save-btn" onClick={handleUpdatePassword}>Update Password</button>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}