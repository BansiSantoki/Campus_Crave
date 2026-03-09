// CRUD Implementation Pattern Guide
// Use this pattern for remaining pages: IncomingOrders.jsx, UpdateOrders.jsx, StudentDashboard.jsx, etc.

// ============================================
// 1. STATE SETUP (Add this to your component)
// ============================================

import { useState, useEffect } from "react";

const [items, setItems] = useState([]);
const [showAddModal, setShowAddModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
const [searchTerm, setSearchTerm] = useState("");
const [formData, setFormData] = useState({
id: "",
// Add all form fields here
});
const [errors, setErrors] = useState({});

// ============================================
// 2. USEEFFECT - LOAD DATA FROM STORAGE
// ============================================

useEffect(() => {
const stored = JSON.parse(localStorage.getItem("items")) || [
// Add default sample data
];
setItems(stored);
}, []);

// ============================================
// 3. VALIDATION FUNCTION
// ============================================

const validateForm = () => {
const newErrors = {};
// Add validation rules
return newErrors;
};

// ============================================
// 4. FILTERING (Optional)
// ============================================

const filteredItems = items.filter(item =>
item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// ============================================
// 5. CRUD HANDLERS
// ============================================

const handleAddClick = () => {
setFormData({ id: "", /_ reset fields _/ });
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
localStorage.setItem("items", JSON.stringify(updated));
setShowAddModal(false);
alert("Item added successfully!");
};

const handleSaveEdit = () => {
const newErrors = validateForm();
setErrors(newErrors);
if (Object.keys(newErrors).length > 0) return;

const updated = items.map(i => i.id === formData.id ? formData : i);
setItems(updated);
localStorage.setItem("items", JSON.stringify(updated));
setShowEditModal(false);
alert("Item updated successfully!");
};

const handleDelete = (id) => {
if (confirm("Are you sure?")) {
const updated = items.filter(i => i.id !== id);
setItems(updated);
localStorage.setItem("items", JSON.stringify(updated));
}
};

// ============================================
// 6. MODALS IN JSX
// ============================================

{/_ ADD MODAL _/}
{showAddModal && (

  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h3>Add New Item</h3>
        <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
      </div>
      <div className="modal-body">
        <input 
          type="text" 
          placeholder="Field" 
          value={formData.field} 
          onChange={(e) => setFormData({...formData, field: e.target.value})} 
          className={errors.field ? "input-error" : ""} 
        />
        {errors.field && <span className="field-error">{errors.field}</span>}
      </div>
      <div className="modal-footer">
        <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
        <button className="save-btn" onClick={handleSaveAdd}>Save</button>
      </div>
    </div>
  </div>
)}

{/_ EDIT MODAL - Same structure as ADD MODAL but with handleSaveEdit _/}

{/_ VIEW MODAL _/}
{showViewModal && selectedItem && (

  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h3>Item Details</h3>
        <button className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
      </div>
      <div className="modal-body view-details">
        <div className="detail-row">
          <label>Field:</label>
          <span>{selectedItem.field}</span>
        </div>
      </div>
      <div className="modal-footer">
        <button className="close-modal-btn" onClick={() => setShowViewModal(false)}>Close</button>
      </div>
    </div>
  </div>
)}

// ============================================
// PAGES TO UPDATE WITH THIS PATTERN:
// ============================================
// ✓ COMPLETED:
// - ManageStallOwners.jsx
// - ManageStudents.jsx
// - ManageStalls.jsx
// - ManageMenuItems.jsx
//
// ⏳ TODO (Use pattern above):
// - IncomingOrders.jsx (orders list with status update)
// - UpdateOrders.jsx (update order status with modal)
// - SalesSummary.jsx (view sales data - mostly view only)
// - StudentDashboard.jsx (view orders)
// - BrowseMenu.jsx (view menu items - read only)
// - ViewStall.jsx (view stall details - read only)
