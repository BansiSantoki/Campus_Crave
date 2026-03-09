import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const adminEmail = "admin@campus.com";
  const adminPassword = "admin123";

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleLogin = (e) => {
    e?.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);
    setSubmitted(true);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    if (email === adminEmail && password === adminPassword) {
      navigate("/admin");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      setErrors({ submit: "Invalid credentials" });
      return;
    }

    if (user.role === "student") navigate("/student");
    if (user.role === "stall") navigate("/stall");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="icon-circle">+</div>

        <h2>CampusCrave</h2>
        <p className="sub-text">Smart Canteen Pre-Order System</p>

        {errors.submit && <p className="error-message">{errors.submit}</p>}

        <div>
          <input
            type="email"
            placeholder="your.email@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "input-error" : ""}
            />
            <button 
              type="button"
              className="password-toggle-btn" 
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <button className="gradient-btn" onClick={handleLogin}>
          Login
        </button>

        <p className="bottom-text">
          <Link to="/forgot">Forgot Password?</Link>
        </p>

        <p className="bottom-text">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}