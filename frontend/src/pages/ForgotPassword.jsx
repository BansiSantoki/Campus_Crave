import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [errors, setErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Current password validation
    if (!currentPass) {
      newErrors.currentPass = "Current password is required";
    }

    // New password validation
    if (!newPass) {
      newErrors.newPass = "New password is required";
    } else if (newPass.length < 8) {
      newErrors.newPass = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPass)) {
      newErrors.newPass = "Password must contain uppercase, lowercase, and numbers";
    }

    // Check if new password is same as current
    if (newPass === currentPass) {
      newErrors.newPass = "New password must be different from current password";
    }

    return newErrors;
  };

  const handleReset = (e) => {
    e?.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const userIndex = users.findIndex(
      (u) => u.email === email && u.password === currentPass
    );

    if (userIndex === -1) {
      setErrors({ submit: "Invalid email or current password" });
      return;
    }

    users[userIndex].password = newPass;
    localStorage.setItem("users", JSON.stringify(users));

    alert("Password Updated Successfully");
    navigate("/");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="icon-circle">🔒</div>

        <h2>Reset Password</h2>
        <p className="sub-text">Update your account password</p>

        {errors.submit && <p className="error-message">{errors.submit}</p>}

        <div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div>
          <div className="password-input-wrapper">
            <input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Current Password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className={errors.currentPass ? "input-error" : ""}
            />
            <button 
              type="button"
              className="password-toggle-btn" 
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              title={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.currentPass && <span className="field-error">{errors.currentPass}</span>}
        </div>

        <div>
          <div className="password-input-wrapper">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className={errors.newPass ? "input-error" : ""}
            />
            <button 
              type="button"
              className="password-toggle-btn" 
              onClick={() => setShowNewPassword(!showNewPassword)}
              title={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.newPass && <span className="field-error">{errors.newPass}</span>}
        </div>

        <button className="gradient-btn" onClick={handleReset}>
          Update Password
        </button>

        <p className="bottom-text">
          <Link to="/">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}