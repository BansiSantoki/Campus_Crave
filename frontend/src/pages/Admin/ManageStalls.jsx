import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser } from "../../utils/appData";
import {
  createStall,
  deleteStallById,
  fetchAllStalls,
  updateStallById,
} from "../../utils/stallApi";

const CUISINE_OPTIONS = [
  "South Indian",
  "North Indian",
  "Chinese",
  "Fast Food",
  "Beverages",
  "Desserts",
  "Healthy Bowls",
  "Bakery",
  "Street Food",
  "Combos"
];

export default function ManageStalls() {

  const navigate = useNavigate();
  const [stalls, setStalls] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCuisine, setFilterCuisine] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [formData, setFormData] = useState({
    _id: "",
    stallName: "",
    owner: "",
    contact: "",
    cuisine: "",
    status: "Active"
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadStalls = async () => {
      try {
        const dbStalls = await fetchAllStalls();
        if (!isMounted) return;
        setStalls(dbStalls || []);
      } catch (error) {
        if (isMounted) {
          setSubmitError(error.message || "Failed to load stalls");
        }
      }
    };

    loadStalls();
    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.stallName.trim()) newErrors.stallName = "Stall name is required";
    if (!formData.owner.trim()) newErrors.owner = "Owner name is required";
    if (!formData.contact.trim() || !/^\d{10}$/.test(formData.contact.replace(/\D/g, ""))) newErrors.contact = "Valid contact (10 digits) is required";
    if (!formData.cuisine) newErrors.cuisine = "Cuisine type is required";
    return newErrors;
  };

  const filteredStalls = stalls.filter(s => {
    const matchSearch = (s.stallName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (s.owner || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCuisine = ["All", "All Cuisines"].includes(filterCuisine) || s.cuisine === filterCuisine;
    const matchStatus = ["All", "All Status"].includes(filterStatus) || s.status === filterStatus;
    return matchSearch && matchCuisine && matchStatus;
  });

  const handleAddClick = () => {
    setFormData({ _id: "", stallName: "", owner: "", contact: "", cuisine: "", status: "Active" });
    setErrors({});
    setShowAddModal(true);
  };

  const handleEditClick = (stall) => {
    setFormData(stall);
    setErrors({});
    setShowEditModal(true);
  };

  const handleViewClick = (stall) => {
    setSelectedStall(stall);
    setShowViewModal(true);
  };

  const handleSaveAdd = () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    createStall({
      stallName: formData.stallName,
      owner: formData.owner,
      ownerEmail: `${formData.stallName.replace(/\s+/g, "").toLowerCase()}@stall.campus`,
      contact: formData.contact,
      cuisine: formData.cuisine,
      status: formData.status,
    })
      .then(async () => {
        const dbStalls = await fetchAllStalls();
        setStalls(dbStalls || []);
        setShowAddModal(false);
        setSubmitError("");
      })
      .catch((error) => {
        setSubmitError(error.message || "Failed to add stall");
      });
  };

  const handleSaveEdit = () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    updateStallById(formData._id, {
      stallName: formData.stallName,
      owner: formData.owner,
      contact: formData.contact,
      cuisine: formData.cuisine,
      status: formData.status,
    })
      .then(async () => {
        const dbStalls = await fetchAllStalls();
        setStalls(dbStalls || []);
        setShowEditModal(false);
        setSubmitError("");
      })
      .catch((error) => {
        setSubmitError(error.message || "Failed to update stall");
      });
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this stall?")) {
      deleteStallById(id)
        .then(async () => {
          const dbStalls = await fetchAllStalls();
          setStalls(dbStalls || []);
          setSubmitError("");
        })
        .catch((error) => {
          setSubmitError(error.message || "Failed to delete stall");
        });
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

          <li>
            <Link to="/manage-stall-owners">Manage Stall Owners</Link>
          </li>

          <li className="active">
            <Link to="/manage-stalls">Manage Stalls</Link>
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

          <div>
            <Link className="back-link" to="/admin">← Back to Dashboard</Link>
            <h2>Manage Stalls</h2>
            <span className="sub-text">
              View and manage all campus stalls
            </span>
          </div>

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


        {/* Stats */}
        <div className="admin-cards">

          <div className="admin-card">
            <p>Total Stalls</p>
            <h2>{stalls.length}</h2>
          </div>

          <div className="admin-card green">
            <p>Active Stalls</p>
            <h2>{stalls.filter(s => s.status === "Active").length}</h2>
          </div>

          <div className="admin-card purple">
            <p>Total Orders</p>
            <h2>13,580</h2>
          </div>

          <div className="admin-card green">
            <p>Total Revenue</p>
            <h2>₹617K</h2>
          </div>

        </div>



        {/* Filters */}
        <div className="table-filters">

          <input
            className="search-input"
            placeholder="Search by stall name or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={filterCuisine} onChange={(e) => setFilterCuisine(e.target.value)}>
            <option>All Cuisines</option>
            {CUISINE_OPTIONS.map((cuisine) => (
              <option key={`filter-${cuisine}`}>{cuisine}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

        </div>



        {/* Add Button */}
        <div className="top-action">
          <button className="add-btn" onClick={handleAddClick}>
            + Add New Stall
          </button>
        </div>



        {/* Table */}
        <div className="orders-box">
          <table>
            <thead>
              <tr>
                <th>STALL ID</th>
                <th>STALL NAME</th>
                <th>OWNER</th>
                <th>CONTACT</th>
                <th>CUISINE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStalls.map(stall => (
                <tr key={stall._id}>
                  <td>#{stall._id.slice(-6).toUpperCase()}</td>
                  <td>{stall.stallName}</td>
                  <td>{stall.owner}</td>
                  <td>{stall.contact}</td>
                  <td><span className="cuisine-tag">{stall.cuisine}</span></td>
                  <td><span className={`badge ${stall.status === "Active" ? "green" : "red"}`}>{stall.status}</span></td>
                  <td>
                    <button className="view-btn" onClick={() => handleViewClick(stall)}>View</button>
                    <button className="edit-btn" onClick={() => handleEditClick(stall)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(stall._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {submitError && <p className="field-error" style={{ marginTop: "10px" }}>{submitError}</p>}
        </div>

        {/* ADD MODAL */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add New Stall</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="Stall Name" value={formData.stallName} onChange={(e) => setFormData({...formData, stallName: e.target.value})} className={errors.stallName ? "input-error" : ""} />
                {errors.stallName && <span className="field-error">{errors.stallName}</span>}

                <input type="text" placeholder="Owner Name" value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} className={errors.owner ? "input-error" : ""} />
                {errors.owner && <span className="field-error">{errors.owner}</span>}

                <input type="text" placeholder="Contact" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className={errors.contact ? "input-error" : ""} />
                {errors.contact && <span className="field-error">{errors.contact}</span>}

                <select value={formData.cuisine} onChange={(e) => setFormData({...formData, cuisine: e.target.value})} className={errors.cuisine ? "input-error" : ""}>
                  <option value="">Select Cuisine Type</option>
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <option key={`add-${cuisine}`} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
                {errors.cuisine && <span className="field-error">{errors.cuisine}</span>}

                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveAdd}>Add Stall</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Stall</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="Stall Name" value={formData.stallName} onChange={(e) => setFormData({...formData, stallName: e.target.value})} className={errors.stallName ? "input-error" : ""} />
                {errors.stallName && <span className="field-error">{errors.stallName}</span>}

                <input type="text" placeholder="Owner Name" value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} className={errors.owner ? "input-error" : ""} />
                {errors.owner && <span className="field-error">{errors.owner}</span>}

                <input type="text" placeholder="Contact" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className={errors.contact ? "input-error" : ""} />
                {errors.contact && <span className="field-error">{errors.contact}</span>}

                <select value={formData.cuisine} onChange={(e) => setFormData({...formData, cuisine: e.target.value})} className={errors.cuisine ? "input-error" : ""}>
                  <option value="">Select Cuisine Type</option>
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <option key={`edit-${cuisine}`} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
                {errors.cuisine && <span className="field-error">{errors.cuisine}</span>}

                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveEdit}>Update Stall</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {showViewModal && selectedStall && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Stall Details</h3>
                <button className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
              </div>
              <div className="modal-body view-details">
                <div className="detail-row">
                  <label>Stall ID:</label>
                  <span>#{selectedStall._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="detail-row">
                  <label>Stall Name:</label>
                  <span>{selectedStall.stallName}</span>
                </div>
                <div className="detail-row">
                  <label>Owner:</label>
                  <span>{selectedStall.owner}</span>
                </div>
                <div className="detail-row">
                  <label>Contact:</label>
                  <span>{selectedStall.contact}</span>
                </div>
                <div className="detail-row">
                  <label>Cuisine Type:</label>
                  <span>{selectedStall.cuisine}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`badge ${selectedStall.status === "Active" ? "green" : "red"}`}>{selectedStall.status}</span>
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