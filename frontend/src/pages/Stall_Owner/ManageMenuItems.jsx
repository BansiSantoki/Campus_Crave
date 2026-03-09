import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ManageMenuItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
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
    status: "Available"
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("menuItems")) || [
      { id: 1, name: "Masala Dosa", category: "South Indian", price: "50", description: "Crispy dosa with spiced potatoes", status: "Available" },
      { id: 2, name: "Idli Sambar", category: "South Indian", price: "40", description: "Soft idlis with sambar", status: "Available" },
      { id: 3, name: "Vada Sambar", category: "South Indian", price: "35", description: "Crispy vada with sambar", status: "Unavailable" }
    ];
    setItems(stored);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Item name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.price || isNaN(formData.price)) newErrors.price = "Valid price is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    return newErrors;
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setFormData({ id: "", name: "", category: "", price: "", description: "", status: "Available" });
    setErrors({});
    setShowAddModal(true);
  };

  const handleEditClick = (item) => {
    setFormData(item);
    setErrors({});
    setShowEditModal(true);
  };

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleSaveAdd = () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const newItem = { ...formData, id: Date.now() };
    const updated = [...items, newItem];
    setItems(updated);
    localStorage.setItem("menuItems", JSON.stringify(updated));
    setShowAddModal(false);
    alert("Menu item added successfully!");
  };

  const handleSaveEdit = () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const updated = items.map(i => i.id === formData.id ? formData : i);
    setItems(updated);
    localStorage.setItem("menuItems", JSON.stringify(updated));
    setShowEditModal(false);
    alert("Menu item updated successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      localStorage.setItem("menuItems", JSON.stringify(updated));
    }
  };

  return (
    <div className="dashboard-container">

      {/* Sidebar */}
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


      {/* MAIN */}
      <main className="main">

        {/* Header */}
        <div className="header">
          <div>
            <p className="back-link">← Back to Dashboard</p>
            <h2>Manage Menu Items</h2>
            <span className="sub-text">
              Add, edit, or remove items from your menu
            </span>
          </div>

          <button className="add-item-btn" onClick={handleAddClick}>+ Add New Item</button>
        </div>


        {/* Stats */}
        <div className="menu-stats">

          <div className="menu-stat-card">
            <p>Total Items</p>
            <h2>{items.length}</h2>
          </div>

          <div className="menu-stat-card available">
            <p>Available</p>
            <h2>{items.filter(i => i.status === "Available").length}</h2>
          </div>

          <div className="menu-stat-card unavailable">
            <p>Unavailable</p>
            <h2>{items.filter(i => i.status === "Unavailable").length}</h2>
          </div>

        </div>


        {/* Menu Table */}
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
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>₹{item.price}</td>
                  <td><span className={`badge ${item.status === "Available" ? "green" : "red"}`}>{item.status}</span></td>
                  <td>
                    <button className="view-btn" onClick={() => handleViewClick(item)}>View</button>
                    <button className="edit-btn" onClick={() => handleEditClick(item)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
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
                <h3>Add New Menu Item</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="Item Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={errors.name ? "input-error" : ""} />
                {errors.name && <span className="field-error">{errors.name}</span>}

                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={errors.category ? "input-error" : ""}>
                  <option>Select Category</option>
                  <option>South Indian</option>
                  <option>North Indian</option>
                  <option>Chinese</option>
                  <option>Fast Food</option>
                  <option>Beverages</option>
                  <option>Desserts</option>
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}

                <input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className={errors.price ? "input-error" : ""} />
                {errors.price && <span className="field-error">{errors.price}</span>}

                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={errors.description ? "input-error" : ""} />
                {errors.description && <span className="field-error">{errors.description}</span>}

                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option>Available</option>
                  <option>Unavailable</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveAdd}>Add Item</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Menu Item</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="Item Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={errors.name ? "input-error" : ""} />
                {errors.name && <span className="field-error">{errors.name}</span>}

                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={errors.category ? "input-error" : ""}>
                  <option>Select Category</option>
                  <option>South Indian</option>
                  <option>North Indian</option>
                  <option>Chinese</option>
                  <option>Fast Food</option>
                  <option>Beverages</option>
                  <option>Desserts</option>
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}

                <input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className={errors.price ? "input-error" : ""} />
                {errors.price && <span className="field-error">{errors.price}</span>}

                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={errors.description ? "input-error" : ""} />
                {errors.description && <span className="field-error">{errors.description}</span>}

                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option>Available</option>
                  <option>Unavailable</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveEdit}>Update Item</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {showViewModal && selectedItem && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Menu Item Details</h3>
                <button className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
              </div>
              <div className="modal-body view-details">
                <div className="detail-row">
                  <label>Item ID:</label>
                  <span>#{selectedItem.id}</span>
                </div>
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedItem.name}</span>
                </div>
                <div className="detail-row">
                  <label>Category:</label>
                  <span>{selectedItem.category}</span>
                </div>
                <div className="detail-row">
                  <label>Price:</label>
                  <span>₹{selectedItem.price}</span>
                </div>
                <div className="detail-row">
                  <label>Description:</label>
                  <span>{selectedItem.description}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`badge ${selectedItem.status === "Available" ? "green" : "red"}`}>{selectedItem.status}</span>
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