import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  requestForgotPasswordOtp,
  resetForgotPasswordWithOtp,
} from "../utils/authApi";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isOtpMode, setIsOtpMode] = useState(false);

  const validateEmail = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    return newErrors;
  };

  const validateReset = () => {
    const newErrors = validateEmail();

    if (!otp.trim()) {
      newErrors.otp = "OTP is required";
    } else if (!/^\d{6}$/.test(otp.trim())) {
      newErrors.otp = "OTP must be 6 digits";
    }

    if (!newPass) {
      newErrors.newPass = "New password is required";
    } else if (newPass.length < 8) {
      newErrors.newPass = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPass)) {
      newErrors.newPass = "Password must contain uppercase, lowercase, and numbers";
    }

    if (!confirmPass) {
      newErrors.confirmPass = "Confirm password is required";
    } else if (newPass !== confirmPass) {
      newErrors.confirmPass = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const newErrors = validateEmail();
    setErrors(newErrors);
    setSuccessMessage("");

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await requestForgotPasswordOtp({
        email: String(email || "").trim().toLowerCase(),
      });

      console.log("OTP Response:", response);

      const otpEmailSent = Boolean(response?.otpEmailSent);
      const hasDevOtp = Boolean(response?.devOtp);

      if (!otpEmailSent && !hasDevOtp) {
        throw new Error(response?.message || "OTP email could not be sent. Please try again.");
      }

      setOtpSent(true);
      setIsOtpMode(true);

      if (hasDevOtp) {
        setDevOtpHint(String(response.devOtp));
        setSuccessMessage(
          response?.message ||
            "Email OTP failed. Development OTP displayed below for testing."
        );
      } else {
        setDevOtpHint("");
        setSuccessMessage(response?.message || "OTP sent to the email you entered");
      }
    } catch (error) {
      console.error("OTP request error:", error);
      setErrors({ submit: error.message || "Failed to send OTP" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e?.preventDefault();
    const newErrors = validateReset();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      await resetForgotPasswordWithOtp({
        email: String(email || "").trim().toLowerCase(),
        otp: String(otp || "").trim(),
        newPassword: newPass,
        confirmPassword: confirmPass,
      });

      alert("Password reset successfully");
      navigate("/");
    } catch (error) {
      setErrors({ submit: error.message || "Failed to reset password" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="icon-circle">🔒</div>

        <h2>Forgot Password</h2>
        <p className="sub-text">Enter your account email to receive an OTP</p>

        {errors.submit && <p className="error-message">{errors.submit}</p>}

        {successMessage && (
          <p className="success-message" style={{ color: "#059669", fontWeight: 600, marginBottom: "12px", padding: "8px", backgroundColor: "#ecfdf5", borderRadius: "4px" }}>
            ✓ {successMessage}
          </p>
        )}

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

        {!otpSent && (
          <button className="gradient-btn" onClick={handleSendOtp} disabled={submitting}>
            {submitting ? "Sending OTP..." : "Send OTP"}
          </button>
        )}

        {otpSent && (
          <>
            {devOtpHint && (
              <div style={{ 
                marginBottom: "16px", 
                padding: "12px", 
                backgroundColor: "#dbeafe", 
                border: "2px solid #0284c7",
                borderRadius: "6px",
                textAlign: "center"
              }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#0c4a6e", fontWeight: 600 }}>
                  📋 DEVELOPMENT MODE - OTP DISPLAYED:
                </p>
                <p style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "bold", color: "#0284c7", letterSpacing: "2px", fontFamily: "monospace" }}>
                  {devOtpHint}
                </p>
                <p style={{ margin: "8px 0 0 0", fontSize: "10px", color: "#0c4a6e" }}>
                  ⬇️ Copy and paste above ⬇️ 
                </p>
                <p style={{ margin: "6px 0 0 0", fontSize: "9px", color: "#075985", fontStyle: "italic" }}>
                  (In production, OTP will be sent to the email you entered)
                </p>
              </div>
            )}
            <div>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={errors.otp ? "input-error" : ""}
              />
              {errors.otp && <span className="field-error">{errors.otp}</span>}
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

            <div>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className={errors.confirmPass ? "input-error" : ""}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.confirmPass && <span className="field-error">{errors.confirmPass}</span>}
            </div>

            <button className="gradient-btn" onClick={handleReset} disabled={submitting}>
              {submitting ? "Resetting..." : "Reset Password"}
            </button>

            <p className="bottom-text">
              Didn't receive OTP?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={handleSendOtp}
                disabled={submitting}
                style={{ background: "none", border: "none", color: "#166534", cursor: "pointer", padding: 0 }}
              >
                Resend OTP
              </button>
            </p>
          </>
        )}

        <p className="bottom-text">
          <Link to="/">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}