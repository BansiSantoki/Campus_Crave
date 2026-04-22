import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../utils/authApi";

export default function StallOwnerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ownerId: "Will be generated on submit",
    firstName: "",
    lastName: "",
    stallName: "",
    email: "",
    phone: "",
    cuisineType: "",
    password: "",
    confirmPassword: "",
    role: "stall"
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.stallName.trim()) newErrors.stallName = "Stall name is required";

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!form.cuisineType || form.cuisineType === "Select Cuisine") {
      newErrors.cuisineType = "Cuisine type is required";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and numbers";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      await registerUser({
        studentId: `OWN${Date.now().toString().slice(-6)}`,
        firstName: form.firstName,
        lastName: form.lastName,
        stallName: form.stallName,
        email: form.email,
        phone: form.phone,
        department: form.cuisineType,
        year: "Owner",
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: "stall",
      });

      alert("Stall Owner registered successfully!");
      navigate("/");
    } catch (error) {
      setErrors({ submit: error.message || "Registration failed" });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="icon-circle">SO</div>
        <h2>Stall Owner Register</h2>
        <p className="sub-text">Create your CampusCrave stall owner account</p>

        {errors.submit && <p className="error-message">{errors.submit}</p>}

        <input value={form.ownerId} disabled />

        <div className="row">
          <div>
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className={errors.firstName ? "input-error" : ""}
            />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>

          <div>
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className={errors.lastName ? "input-error" : ""}
            />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>
        </div>

        <input
          name="stallName"
          placeholder="Stall Name"
          value={form.stallName}
          onChange={handleChange}
          className={errors.stallName ? "input-error" : ""}
        />
        {errors.stallName && <span className="field-error">{errors.stallName}</span>}

        <input
          name="email"
          placeholder="Business Email Address"
          value={form.email}
          onChange={handleChange}
          className={errors.email ? "input-error" : ""}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}

        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className={errors.phone ? "input-error" : ""}
        />
        {errors.phone && <span className="field-error">{errors.phone}</span>}

        <select
          name="cuisineType"
          value={form.cuisineType}
          onChange={handleChange}
          className={errors.cuisineType ? "input-error" : ""}
        >
          <option>Select Cuisine</option>
          <option>South Indian</option>
          <option>North Indian</option>
          <option>Chinese</option>
          <option>Fast Food</option>
          <option>Beverages</option>
          <option>Desserts</option>
        </select>
        {errors.cuisineType && <span className="field-error">{errors.cuisineType}</span>}

        <div className="row">
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "input-error" : ""}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>
        </div>

        <button className="gradient-btn" onClick={handleRegister}>
          Register Stall Owner
        </button>

        <p className="bottom-text">
          Are you a student? <Link to="/register">Register as Student</Link>
        </p>

        <p className="bottom-text">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
}
