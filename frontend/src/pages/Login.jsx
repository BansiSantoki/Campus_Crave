import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../utils/authApi";
import { setCurrentUser } from "../utils/appData";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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

  const handleLogin = async (e) => {
    e?.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      const loginValue = email.trim();
      const payload = await loginUser({
        email: loginValue.toLowerCase(),
        password,
      });

      const user = payload?.user;
      if (!user) {
        setErrors({ submit: "Login failed. User data not found." });
        return;
      }

      setCurrentUser(user);

      const role = String(user.role || "").toLowerCase();
      if (role === "admin") {
        navigate("/admin");
        return;
      }
      if (role === "stall") {
        navigate("/stall");
        return;
      }
      navigate("/student");
    } catch (error) {
      setErrors({ submit: error.message || "Invalid credentials" });
    } finally {
      setSubmitting(false);
    }
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
            type="text"
            placeholder="Email address"
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

        <button className="gradient-btn" onClick={handleLogin} disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>

        <p className="bottom-text">
          <Link to="/forgot">Forgot Password?</Link>
        </p>

        <p className="bottom-text">
          Don't have an account? <Link to="/register">Choose registration type</Link>
        </p>
      </div>
    </div>
  );
}