import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../utils/authApi";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};

    // Student ID validation
    if (!form.studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    }

    // First Name validation
    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (form.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation
    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (form.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    // Department validation
    if (!form.department || form.department === "Select Department") {
      newErrors.department = "Department is required";
    }

    // Year validation
    if (!form.year || form.year === "Select Year") {
      newErrors.year = "Year is required";
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and numbers";
    }

    // Confirm Password validation
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

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await registerUser({
        studentId: form.studentId.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        department: form.department,
        year: form.year,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: "student",
      });

      const verifyMessage = response?.verificationEmailSent
        ? "Verification email sent successfully."
        : response?.verificationEmailMessage || "Verification email not sent.";

      alert(`Registered Successfully! ${verifyMessage}`);
      navigate("/");
    } catch (error) {
      setErrors({ submit: error.message || "Registration failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="icon-circle">👤+</div>
        <h2>Create Account</h2>
        <p className="sub-text">Student registration for CampusCrave</p>
        {errors.submit && <p className="error-message">{errors.submit}</p>}

        <input 
          name="studentId" 
          placeholder="Student ID" 
          value={form.studentId}
          onChange={handleChange}
          className={errors.studentId ? "input-error" : ""}
        />
        {errors.studentId && <span className="field-error">{errors.studentId}</span>}

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

        <div>
          <input 
            name="email" 
            placeholder="College Email Address" 
            value={form.email}
            onChange={handleChange}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div>
          <input 
            name="phone" 
            placeholder="Phone Number" 
            value={form.phone}
            onChange={handleChange}
            className={errors.phone ? "input-error" : ""}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="row">
          <div>
            <select 
              name="department" 
              value={form.department}
              onChange={handleChange}
              className={errors.department ? "input-error" : ""}
            >
              <option>Select Department</option>
              <option>MCA</option>
              <option>BCA</option>
              <option>BBA</option>
            </select>
            {errors.department && <span className="field-error">{errors.department}</span>}
          </div>

          <div>
            <select 
              name="year" 
              value={form.year}
              onChange={handleChange}
              className={errors.year ? "input-error" : ""}
            >
              <option>Select Year</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
            </select>
            {errors.year && <span className="field-error">{errors.year}</span>}
          </div>
        </div>

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

        <button className="gradient-btn" onClick={handleRegister} disabled={submitting}>
          {submitting ? "Registering..." : "Register"}
        </button>

        <p className="bottom-text">
          Want to register a stall? <Link to="/register/stall-owner">Stall owner sign up</Link>
        </p>

        <p className="bottom-text">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
}