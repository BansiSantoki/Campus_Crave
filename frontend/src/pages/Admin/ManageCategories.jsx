import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName } from "../../utils/appData";
import {
  createCategory,
  deleteCategoryById,
  fetchCategories,
  updateCategoryById,
} from "../../utils/categoryApi";

export default function ManageCategories() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const adminName = getDisplayName(currentUser);

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", status: "Active" });
  const [errors, setErrors] = useState({});

  const loadCategories = async (query = "") => {
    setLoading(true);
    try {
      const result = await fetchCategories(query ? { search: query } : {});
      setCategories(Array.isArray(result) ? result : []);
    } catch (error) {
      setSubmitError(error.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      loadCategories();
      return undefined;
    }

    const timer = setTimeout(() => loadCategories(trimmed), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredCategories = useMemo(
    () => categories.filter((category) => String(category.name || "").toLowerCase().includes(searchTerm.toLowerCase())),
    [categories, searchTerm],
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Category name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.status) newErrors.status = "Status is required";
    return newErrors;
  };

  const handleAddClick = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", status: "Active" });
    setErrors({});
    setShowModal(true);
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      status: category.status || "Active",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      if (editingCategory) {
        await updateCategoryById(editingCategory.id || editingCategory._id, formData);
      } else {
        await createCategory({ ...formData, createdBy: adminName, createdByEmail: currentUser?.email || "" });
      }

      await loadCategories(searchTerm.trim());
      setShowModal(false);
      setSubmitError("");
    } catch (error) {
      setSubmitError(error.message || "Failed to save category");
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category ${category.name}?`)) return;

    try {
      await deleteCategoryById(category.id || category._id || category.name);
      await loadCategories(searchTerm.trim());
    } catch (error) {
      setSubmitError(error.message || "Failed to delete category");
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar admin-sidebar">
        <div className="brand">
          <div className="brand-logo">CC</div>
          <div>
            <h3>CampusCrave</h3>
            <p>Admin Portal</p>
          </div>
        </div>

        <ul className="nav-links">
          <li><Link to="/admin">Dashboard</Link></li>
          <li><Link to="/manage-students">Manage Students</Link></li>
          <li><Link to="/manage-stall-owners">Manage Stall Owners</Link></li>
          <li><Link to="/manage-stalls">Manage Stalls</Link></li>
          <li className="active"><Link to="/manage-categories">Manage Categories</Link></li>
          <li><Link to="/view-reports">View Reports</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <Link className="back-link" to="/admin">← Back to Dashboard</Link>
            <h2>Manage Categories</h2>
            <span className="sub-text">Create, update, search, and delete food categories</span>
          </div>

          <div className="user-box">
            <div className="user-details">
              <p>{adminName}</p>
              <span>System Administrator</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="admin-cards">
          <div className="admin-card">
            <p>Total Categories</p>
            <h2>{categories.length}</h2>
          </div>
          <div className="admin-card green">
            <p>Active Categories</p>
            <h2>{categories.filter((category) => category.status !== "Inactive").length}</h2>
          </div>
          <div className="admin-card orange">
            <p>Search Results</p>
            <h2>{filteredCategories.length}</h2>
          </div>
        </div>

        <div className="table-filters">
          <input
            className="search-input"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="add-btn" onClick={handleAddClick}>+ Add Category</button>
        </div>

        {submitError && <p className="field-error">{submitError}</p>}
        {loading && <p className="sub-text">Loading categories...</p>}

        <div className="orders-box">
          <table>
            <thead>
              <tr>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id || category._id || category.name}>
                  <td>{category.name}</td>
                  <td>{category.description || "-"}</td>
                  <td>
                    <span className={`badge ${category.status === "Active" ? "green" : "gray"}`}>
                      {category.status || "Active"}
                    </span>
                  </td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditClick(category)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(category)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!loading && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="4">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingCategory ? "Edit Category" : "Add Category"}</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "input-error" : ""}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}

                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={errors.description ? "input-error" : ""}
                />
                {errors.description && <span className="field-error">{errors.description}</span>}

                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={errors.status ? "input-error" : ""}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && <span className="field-error">{errors.status}</span>}
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSave}>Save Category</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}