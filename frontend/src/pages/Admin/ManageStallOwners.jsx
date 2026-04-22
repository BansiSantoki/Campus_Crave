import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser } from "../../utils/appData";
import {
  createRegistration,
  deleteRegistrationById,
  fetchRegistrations,
  updateRegistrationById,
} from "../../utils/authApi";

export default function ManageStallOwners() {

  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    ownerName: "",
    stallName: "",
    email: "",
    phone: "",
    cuisineType: "",
    status: "Active",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadOwners = async () => {
      setLoading(true);
      try {
        const registrations = await fetchRegistrations();
        if (!isMounted) return;

        const normalizedOwners = (registrations || [])
          .filter((user) => user.role === "stall")
          .map((user) => ({
            id: user._id,
            studentId: user.studentId || "",
            ownerName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            stallName: user.stallName || "Not set",
            email: user.email || "",
            phone: user.phone || "",
            cuisineType: user.department || "",
            status: user.Status || "Active",
          }));

        setOwners(normalizedOwners);
      } catch (error) {
        if (isMounted) {
          setSubmitError(error.message || "Failed to load stall owners");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOwners();

    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!formData.stallName.trim()) newErrors.stallName = "Stall name is required";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Valid email is required";
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) newErrors.phone = "Valid phone (10 digits) is required";
    if (!formData.cuisineType) newErrors.cuisineType = "Cuisine type is required";
    if (!showEditModal) {
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    return newErrors;
  };

  const cuisineOptions = useMemo(
    () => [...new Set(owners.map((owner) => owner.cuisineType).filter(Boolean))],
    [owners]
  );

  const handleAddClick = () => {
    setFormData({
      id: "",
      ownerName: "",
      firstName: "",
      lastName: "",
      stallName: "",
      email: "",
      phone: "",
      cuisineType: "",
      status: "Active",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setSubmitError("");
    setShowAddModal(true);
  };

  const handleEditClick = (owner) => {
    const [firstName = "", ...lastParts] = (owner.ownerName || "").split(" ");
    setFormData({
      ...owner,
      firstName,
      lastName: lastParts.join(" "),
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setSubmitError("");
    setShowEditModal(true);
  };

  const handleViewClick = (owner) => {
    setSelectedOwner(owner);
    setShowViewModal(true);
  };

  const handleSaveAdd = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const [firstName = "", ...lastParts] = formData.ownerName.trim().split(" ");
    const lastName = lastParts.join(" ") || "Owner";

    try {
      await createRegistration({
        studentId: `OWN${Date.now().toString().slice(-6)}`,
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.cuisineType,
        year: "Owner",
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: "stall",
      });

      const registrations = await fetchRegistrations();
      setOwners(
        (registrations || [])
          .filter((user) => user.role === "stall")
          .map((user) => ({
            id: user._id,
            studentId: user.studentId || "",
            ownerName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            stallName: user.stallName || "Not set",
            email: user.email || "",
            phone: user.phone || "",
            cuisineType: user.department || "",
            status: user.Status || "Active",
          }))
      );
      setShowAddModal(false);
    } catch (error) {
      setSubmitError(error.message || "Failed to add stall owner");
    }
  };

  const handleSaveEdit = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const [firstName = "", ...lastParts] = formData.ownerName.trim().split(" ");
    const lastName = lastParts.join(" ") || "Owner";

    try {
      await updateRegistrationById(formData.id, {
        studentId: formData.studentId || `OWN${Date.now().toString().slice(-6)}`,
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.cuisineType,
        year: "Owner",
        role: "stall",
      });

      setOwners((prev) =>
        prev.map((owner) =>
          owner.id === formData.id
            ? {
                ...owner,
                ownerName: formData.ownerName,
                stallName: formData.stallName,
                email: formData.email,
                phone: formData.phone,
                cuisineType: formData.cuisineType,
              }
            : owner
        )
      );
      setShowEditModal(false);
    } catch (error) {
      setSubmitError(error.message || "Failed to update stall owner");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this stall owner?")) {
      try {
        await deleteRegistrationById(id);
        setOwners((prev) => prev.filter((owner) => owner.id !== id));
      } catch (error) {
        setSubmitError(error.message || "Failed to delete stall owner");
      }
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <aside className="sidebar admin-sidebar">

        <div className="brand">
          <div className="brand-logo">CC</div>
          <div>
            <h3>CampusCrave</h3>
            <p>Admin Portal</p>
          </div>
        </div>

        <ul className="nav-links">

          <li>
            <Link to="/admin">Dashboard</Link>
          </li>

          <li>
            <Link to="/manage-students">Manage Students</Link>
          </li>

          <li className="active">
            <Link to="/manage-stall-owners">Manage Stall Owners</Link>
          </li>

          <li>
            <Link to="/manage-stalls">Manage Stalls</Link>
          </li>

          <li>
            <Link to="/manage-categories">Manage Categories</Link>
          </li>

          <li>
            <Link to="/view-reports">View Reports</Link>
          </li>

        </ul>

      </aside>


      {/* MAIN */}
      <main className="main">

        {/* Header */}
        <div className="header">

          <h2>Manage Stall Owners</h2>

          <div className="user-box">

            <div className="user-details">
              <p>Admin User</p>
              <span>System Administrator</span>
            </div>

            <button className="logout" onClick={handleLogout}>
              Logout
            </button>

          </div>

        </div>


        {/* Add Button */}
        <div className="top-action">
          <button className="add-btn" onClick={handleAddClick}>
            + Add New Stall Owner
          </button>
        </div>

        {loading && <p className="sub-text">Loading stall owners from database...</p>}
        {submitError && <p className="error-message">{submitError}</p>}

        {/* Table */}
        <div className="orders-box">
          <table>
            <thead>
              <tr>
                <th>OWNER ID</th>
                <th>NAME</th>
                <th>STALL NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>CUISINE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {owners.map(owner => (
                <tr key={owner.id}>
                  <td>#{owner.id}</td>
                  <td>{owner.ownerName}</td>
                  <td>{owner.stallName}</td>
                  <td>{owner.email}</td>
                  <td>{owner.phone}</td>
                  <td>{owner.cuisineType}</td>
                  <td><span className={`badge ${owner.status === "Active" ? "green" : "red"}`}>{owner.status}</span></td>
                  <td>
                    <button className="view-btn" onClick={() => handleViewClick(owner)}>View</button>
                    <button className="edit-btn" onClick={() => handleEditClick(owner)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(owner.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ADD MODAL */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add New Stall Owner</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="Owner Name" value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} className={errors.ownerName ? "input-error" : ""} />
                {errors.ownerName && <span className="field-error">{errors.ownerName}</span>}

                <input type="text" placeholder="Stall Name" value={formData.stallName} onChange={(e) => setFormData({...formData, stallName: e.target.value})} className={errors.stallName ? "input-error" : ""} />
                {errors.stallName && <span className="field-error">{errors.stallName}</span>}

                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={errors.email ? "input-error" : ""} />
                {errors.email && <span className="field-error">{errors.email}</span>}

                <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={errors.phone ? "input-error" : ""} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}

                <select value={formData.cuisineType} onChange={(e) => setFormData({...formData, cuisineType: e.target.value})} className={errors.cuisineType ? "input-error" : ""}>
                  <option>Select Cuisine Type</option>
                  {cuisineOptions.map((cuisine) => (
                    <option key={`add-${cuisine}`}>{cuisine}</option>
                  ))}
                  <option>South Indian</option>
                  <option>North Indian</option>
                  <option>Fast Food</option>
                  <option>Beverages</option>
                  <option>Desserts</option>
                </select>
                {errors.cuisineType && <span className="field-error">{errors.cuisineType}</span>}

                <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={errors.password ? "input-error" : ""} />
                {errors.password && <span className="field-error">{errors.password}</span>}

                <input type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className={errors.confirmPassword ? "input-error" : ""} />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}

                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveAdd}>Add Owner</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Stall Owner</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="Owner Name" value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} className={errors.ownerName ? "input-error" : ""} />
                {errors.ownerName && <span className="field-error">{errors.ownerName}</span>}

                <input type="text" placeholder="Stall Name" value={formData.stallName} onChange={(e) => setFormData({...formData, stallName: e.target.value})} className={errors.stallName ? "input-error" : ""} />
                {errors.stallName && <span className="field-error">{errors.stallName}</span>}

                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={errors.email ? "input-error" : ""} />
                {errors.email && <span className="field-error">{errors.email}</span>}

                <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={errors.phone ? "input-error" : ""} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}

                <select value={formData.cuisineType} onChange={(e) => setFormData({...formData, cuisineType: e.target.value})} className={errors.cuisineType ? "input-error" : ""}>
                  <option>Select Cuisine Type</option>
                  {cuisineOptions.map((cuisine) => (
                    <option key={`edit-${cuisine}`}>{cuisine}</option>
                  ))}
                  <option>South Indian</option>
                  <option>North Indian</option>
                  <option>Fast Food</option>
                  <option>Beverages</option>
                  <option>Desserts</option>
                </select>
                {errors.cuisineType && <span className="field-error">{errors.cuisineType}</span>}

                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveEdit}>Update Owner</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {showViewModal && selectedOwner && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Stall Owner Details</h3>
                <button className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
              </div>
              <div className="modal-body view-details">
                <div className="detail-row">
                  <label>Owner ID:</label>
                  <span>#{selectedOwner.id}</span>
                </div>
                <div className="detail-row">
                  <label>Owner Name:</label>
                  <span>{selectedOwner.ownerName}</span>
                </div>
                <div className="detail-row">
                  <label>Stall Name:</label>
                  <span>{selectedOwner.stallName}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedOwner.email}</span>
                </div>
                <div className="detail-row">
                  <label>Phone:</label>
                  <span>{selectedOwner.phone}</span>
                </div>
                <div className="detail-row">
                  <label>Cuisine Type:</label>
                  <span>{selectedOwner.cuisineType}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`badge ${selectedOwner.status === "Active" ? "green" : "red"}`}>{selectedOwner.status}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="close-modal-btn" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}