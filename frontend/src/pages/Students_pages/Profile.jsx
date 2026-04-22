import { useMemo, useRef, useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  getDisplayName,
  getCart,
  setCurrentUser,
} from "../../utils/appData";
import { forgotPasswordUser, updateRegistrationById } from "../../utils/authApi";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function getProfilePictureUrl(fileName) {
  if (!fileName) return "";
  if (/^https?:\/\//i.test(fileName)) return fileName;
  return `${API_ORIGIN}/uploads/profilePics/${encodeURIComponent(fileName)}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const cartCount = getCart(currentUser).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const initialName = getDisplayName(currentUser);
  const [firstName = "", ...restName] = initialName.split(" ");
  const lastNameFromName = restName.join(" ");

  const [profile, setProfile] = useState({
    firstName: currentUser?.firstName || firstName,
    lastName: currentUser?.lastName || lastNameFromName,
    studentId: currentUser?.studentId || "N/A",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    department: currentUser?.department || "Computer Science",
    year: currentUser?.year || "1st Year"
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState("");
  const uploadInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const profilePictureUrl = useMemo(() => {
    if (profilePreviewUrl) return profilePreviewUrl;
    return getProfilePictureUrl(currentUser?.profile_picture);
  }, [currentUser?.profile_picture, profilePreviewUrl]);

const handleLogout = () => {
  clearCurrentUser();
  navigate("/");
};

const handleProfileChange = (e) => {
  if (!isEditingProfile) {
    setIsEditingProfile(true);
  }
  setProfile({ ...profile, [e.target.name]: e.target.value });
};

const handleSelectPhoto = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const isImage = /^image\//i.test(file.type);
  if (!isImage) {
    setErrors({ submit: "Please select an image file." });
    return;
  }

  setSelectedProfileFile(file);
  setProfilePreviewUrl(URL.createObjectURL(file));
  setIsEditingProfile(true);
  setErrors({});
};

const resetProfileEditor = () => {
  setProfile({
    firstName: currentUser?.firstName || firstName,
    lastName: currentUser?.lastName || lastNameFromName,
    studentId: currentUser?.studentId || "N/A",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    department: currentUser?.department || "Computer Science",
    year: currentUser?.year || "1st Year",
  });
  setSelectedProfileFile(null);
  setProfilePreviewUrl("");
  setErrors({});
  setIsEditingProfile(false);
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

const handleSaveProfile = async (e) => {
  e?.preventDefault();
  const newErrors = validateProfile();
  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    return;
  }

  try {
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) {
      setErrors({ submit: "Unable to update profile. Please login again." });
      return;
    }

    const payload = {
      studentId: profile.studentId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: String(profile.email || "").trim().toLowerCase(),
      phone: String(profile.phone || "").replace(/\D/g, ""),
      department: profile.department,
      year: profile.year,
      role: currentUser?.role || "student",
      stallName: currentUser?.stallName || "",
    };

    const requestPayload = selectedProfileFile
      ? (() => {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, String(value ?? ""));
          });
          formData.append("profile_picture", selectedProfileFile);
          return formData;
        })()
      : payload;

    const response = await updateRegistrationById(userId, requestPayload);
    const updatedData = response?.data || payload;

    const nextUser = {
      ...(currentUser || {}),
      ...updatedData,
      fullname: `${updatedData?.firstName || payload.firstName} ${updatedData?.lastName || payload.lastName}`.trim(),
      id: currentUser?.id || currentUser?._id || updatedData?.id || updatedData?._id,
      profile_picture: updatedData?.profile_picture || currentUser?.profile_picture,
    };

    setCurrentUser(nextUser);
    setProfile((prev) => ({
      ...prev,
      firstName: updatedData?.firstName || prev.firstName,
      lastName: updatedData?.lastName || prev.lastName,
      email: updatedData?.email || prev.email,
      phone: updatedData?.phone || prev.phone,
      department: updatedData?.department || prev.department,
      year: updatedData?.year || prev.year,
    }));
    setSelectedProfileFile(null);
    setProfilePreviewUrl("");
    setIsEditingProfile(false);
    setErrors({});

    alert("Profile updated successfully!");
  } catch (error) {
    setErrors({ submit: error.message || "Unable to update profile" });
  }
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

const handleUpdatePassword = async (e) => {
  e?.preventDefault();
  const newErrors = validatePassword();
  setPasswordErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    return;
  }

  try {
    await forgotPasswordUser({
      email: profile.email,
      currentPassword: password.currentPassword,
      newPassword: password.newPassword,
      confirmPassword: password.confirmPassword,
    });

    alert("Password updated successfully!");
    setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
  } catch (error) {
    setPasswordErrors({ submit: error.message || "Unable to update password" });
  }
};

const totalSpent = Number((Number(currentUser?.totalSpent || 0)).toFixed(2));

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
           <li><Link to="/cart">View Cart ({cartCount})</Link></li>
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
              <p>{getDisplayName(profile)}</p>
              <span>{`Student ID: ${profile.studentId || "N/A"}`}</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="profile-layout">

          {/* LEFT PROFILE CARD */}
          <div className="profile-card">
            <div className="avatar" style={{ overflow: "hidden", padding: 0 }}>
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                `${(profile.firstName || "S").slice(0, 1)}${(profile.lastName || "T").slice(0, 1)}`.toUpperCase()
              )}
            </div>
            <h3>{getDisplayName(profile)}</h3>
            <p>{profile.studentId || "N/A"}</p>
            <span>{profile.department || "Department"}</span>

            <div className="profile-stats">
              <div>
                <p>Total Orders</p>
                <strong>{currentUser?.totalOrders || 0}</strong>
              </div>
              <div>
                <p>Member Since</p>
                <strong>{new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}</strong>
              </div>
              <div>
                <p>Total Spent</p>
                <strong>{`Rs. ${totalSpent.toFixed(2)}`}</strong>
              </div>
            </div>

            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleSelectPhoto}
            />
            <button className="upload-btn" onClick={() => uploadInputRef.current?.click()}>
              Upload Photo
            </button>
          </div>

          {/* RIGHT SIDE */}
          <div className="profile-right">

            {/* Personal Info */}
            <div className="profile-box">
              <h3>Personal Information</h3>
              {errors.submit && <span className="field-error">{errors.submit}</span>}
              {!isEditingProfile && (
                <p className="sub-text" style={{ marginBottom: "12px" }}>
                  Click Edit Profile to update your details.
                </p>
              )}

              <div className="form-grid">
                <div>
                  <label>First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleProfileChange}
                    disabled={!isEditingProfile}
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
                    disabled={!isEditingProfile}
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
                disabled={!isEditingProfile}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}

              <label>Phone Number</label>
              <input 
                type="text" 
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
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
                    disabled={!isEditingProfile}
                  >
                    <option>Computer Science</option>
                    <option>IT</option>
                    <option>MCA</option>
                    <option>BCA</option>
                    <option>BBA</option>
                  </select>
                </div>

                <div>
                  <label>Year</label>
                  <select 
                    name="year"
                    value={profile.year}
                    onChange={handleProfileChange}
                    disabled={!isEditingProfile}
                  >
                    <option>First Year</option>
                    <option>Second Year</option>
                    <option>Third Year</option>
                  </select>
                </div>
              </div>

              <div className="form-buttons">
                {!isEditingProfile ? (
                  <button className="save-btn" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
                ) : (
                  <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
                )}
                <button className="cancel-btn" onClick={isEditingProfile ? resetProfileEditor : () => navigate("/student")}>Cancel</button>
              </div>
            </div>

            {/* Change Password */}
            <div className="profile-box">
              <h3>Change Password</h3>
              {passwordErrors.submit && <span className="field-error">{passwordErrors.submit}</span>}

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