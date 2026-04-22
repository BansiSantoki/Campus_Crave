import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName, getMenuCategories } from "../../utils/appData";
import { createMenuItem, deleteMenuItemById, fetchMenuItems, resolveStallForOwner, updateMenuItemById } from "../../utils/stallApi";

export default function ManageMenuItems() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [stall, setStall] = useState(null);
  const [stallLoading, setStallLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    description: "",
    image: "",
    status: "Available",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadAssignedStall = async () => {
      setStallLoading(true);
      const resolvedStall = await resolveStallForOwner(currentUser);
      if (!isMounted) {
        return;
      }
      setStall(resolvedStall || null);
      setStallLoading(false);
    };

    loadAssignedStall();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.email, currentUser?.stallName]);

  const loadItems = async () => {
    if (!stall?.id && !stall?._id) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await fetchMenuItems(String(stall._id || stall.id));
      setItems(Array.isArray(list) ? list : []);
      setSubmitError("");
      setLastSyncedAt(new Date());
    } catch (error) {
      setItems([]);
      setSubmitError(error.message || "Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    const intervalId = setInterval(loadItems, 6000);
    return () => clearInterval(intervalId);
  }, [stall?.id, stall?._id]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Item name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }
    if (!formData.description.trim()) newErrors.description = "Description is required";
    return newErrors;
  };

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const query = searchTerm.toLowerCase();
        return (
          String(item.name || "").toLowerCase().includes(query) ||
          String(item.category || "").toLowerCase().includes(query)
        );
      }),
    [items, searchTerm],
  );

  const categories = getMenuCategories();

  const handleAddClick = () => {
    setFormData({ id: "", name: "", category: "", price: "", description: "", image: "", status: "Available" });
    setErrors({});
    setShowAddModal(true);
  };

  const handleEditClick = (item) => {
    setFormData({
      id: item._id || item.id,
      name: item.name || "",
      category: item.category || "",
      price: String(item.price || ""),
      description: item.description || "",
      image: item.image || "",
      status: item.status || "Available",
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleSaveAdd = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || (!stall?.id && !stall?._id)) return;

    try {
      await createMenuItem({
        stallId: String(stall._id || stall.id),
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        description: formData.description.trim(),
        image: String(formData.image || "").trim(),
        status: formData.status,
      });

      setShowAddModal(false);
      await loadItems();
      alert("Menu item added successfully!");
      setSubmitError("");
    } catch (error) {
      setSubmitError(error.message || "Failed to add menu item");
    }
  };

  const handleSaveEdit = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await updateMenuItemById(formData.id, {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        description: formData.description.trim(),
        image: String(formData.image || "").trim(),
        status: formData.status,
      });

      setShowEditModal(false);
      await loadItems();
      alert("Menu item updated successfully!");
      setSubmitError("");
    } catch (error) {
      setSubmitError(error.message || "Failed to update menu item");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteMenuItemById(id);
      await loadItems();
      setSubmitError("");
    } catch (error) {
      setSubmitError(error.message || "Failed to delete menu item");
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  const ownerName = getDisplayName(currentUser);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">CC</div>
          <div>
            <h3>CampusCrave</h3>
            <p>Stall Owner Portal</p>
          </div>
        </div>

        <ul className="nav-links">
          <li><Link to="/stall">Dashboard</Link></li>
          <li className="active"><Link to="/manage-menu">Manage Menu Items</Link></li>
          <li><Link to="/incoming-orders">View Incoming Orders</Link></li>
          <li><Link to="/update-order">Update Order Status</Link></li>
          <li><Link to="/sales-summary">Sales Summary</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <p className="back-link">← Back to Dashboard</p>
            <h2>Manage Menu Items</h2>
            <span className="sub-text">
              {lastSyncedAt
                ? `Add, edit, or remove items from your menu - live sync ${lastSyncedAt.toLocaleTimeString()}`
                : "Add, edit, or remove items from your menu"}
            </span>
          </div>

          <div className="user-box">
            <div className="user-details">
              <p>{stallLoading ? "Loading stall..." : stall?.stallName || "Assigned Stall"}</p>
              <span>{`Owner: ${ownerName}`}</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <button className="add-item-btn" onClick={handleAddClick}>+ Add New Item</button>

        <div className="menu-stats">
          <div className="menu-stat-card">
            <p>Total Items</p>
            <h2>{items.length}</h2>
          </div>

          <div className="menu-stat-card available">
            <p>Available</p>
            <h2>{items.filter((item) => item.status === "Available").length}</h2>
          </div>

          <div className="menu-stat-card unavailable">
            <p>Unavailable</p>
            <h2>{items.filter((item) => item.status !== "Available").length}</h2>
          </div>
        </div>

        <div className="orders-box">
          <div className="table-header">
            <h3>Menu Items</h3>
            <input
              className="search-input"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {submitError && <p className="field-error">{submitError}</p>}

          {loading && <p className="sub-text">Loading menu items...</p>}

          <table>
            <thead>
              <tr>
                <th>ITEM ID</th>
                <th>NAME</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id || item.id}>
                  <td>{`#${item._id || item.id}`}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{`Rs. ${Number(item.price || 0).toFixed(2)}`}</td>
                  <td><span className={`badge ${item.status === "Available" ? "green" : "gray"}`}>{item.status || "Available"}</span></td>
                  <td>
                    <button className="view-btn" onClick={() => handleViewClick(item)}>View</button>
                    <button className="edit-btn" onClick={() => handleEditClick(item)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(item._id || item.id)}>Delete</button>
                  </td>
                </tr>
              ))}

              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6">No menu items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(showAddModal || showEditModal) && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{showAddModal ? "Add New Menu Item" : "Edit Menu Item"}</h3>
                <button className="close-btn" onClick={() => (showAddModal ? setShowAddModal(false) : setShowEditModal(false))}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="Item Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? "input-error" : ""} />
                {errors.name && <span className="field-error">{errors.name}</span>}

                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={errors.category ? "input-error" : ""}>
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}

                <input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={errors.price ? "input-error" : ""} />
                {errors.price && <span className="field-error">{errors.price}</span>}

                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={errors.description ? "input-error" : ""} />
                {errors.description && <span className="field-error">{errors.description}</span>}

                <input
                  type="text"
                  placeholder="Image URL (from database/CDN/uploads)"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />

                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => (showAddModal ? setShowAddModal(false) : setShowEditModal(false))}>Cancel</button>
                <button className="save-btn" onClick={showAddModal ? handleSaveAdd : handleSaveEdit}>{showAddModal ? "Add Item" : "Update Item"}</button>
              </div>
            </div>
          </div>
        )}

        {showViewModal && selectedItem && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Menu Item Details</h3>
                <button className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
              </div>
              <div className="modal-body view-details">
                <div className="detail-row"><label>Item ID:</label><span>{`#${selectedItem._id || selectedItem.id}`}</span></div>
                <div className="detail-row"><label>Name:</label><span>{selectedItem.name}</span></div>
                <div className="detail-row"><label>Category:</label><span>{selectedItem.category}</span></div>
                <div className="detail-row"><label>Price:</label><span>{`Rs. ${Number(selectedItem.price || 0).toFixed(2)}`}</span></div>
                <div className="detail-row"><label>Description:</label><span>{selectedItem.description}</span></div>
                <div className="detail-row"><label>Image:</label><span>{selectedItem.image || "Not set"}</span></div>
                <div className="detail-row"><label>Status:</label><span className={`badge ${selectedItem.status === "Available" ? "green" : "gray"}`}>{selectedItem.status || "Available"}</span></div>
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
