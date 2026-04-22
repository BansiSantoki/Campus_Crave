import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser } from "../../utils/appData";
import {
  createRegistration,
  deleteRegistrationById,
  fetchRegistrations,
  updateRegistrationById,
} from "../../utils/authApi";
import { fetchAllOrders } from "../../utils/orderApi";
import { formatCurrency } from "../../utils/orderInsights";

export default function ManageStudents() {

  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [formData, setFormData] = useState({
    id: "",
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    status: "Active",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [registrations, ordersResult] = await Promise.all([
          fetchRegistrations(),
          fetchAllOrders(),
        ]);

        if (!isMounted) return;

        const normalizedStudents = (registrations || [])
          .filter((user) => user.role === "student")
          .map((user) => ({
            id: user._id,
            studentId: user.studentId || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            department: user.department || "",
            year: user.year || "",
            status: user.Status || "Active",
          }));

        setStudents(normalizedStudents);
        setOrders(ordersResult.orders || []);
      } catch (error) {
        if (isMounted) {
          setSubmitError(error.message || "Failed to load students");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Valid email is required";
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) newErrors.phone = "Valid phone (10 digits) is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.year) newErrors.year = "Year is required";
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

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = ["All", "All Departments"].includes(filterDept) || s.department === filterDept;
    const matchStatus = ["All", "All Status"].includes(filterStatus) || s.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const departmentOptions = useMemo(
    () => [...new Set(students.map((student) => student.department).filter(Boolean))],
    [students]
  );

  const studentOrders = useMemo(
    () => orders.filter((order) => String(order.studentId || "").trim() !== ""),
    [orders]
  );

  const totalRevenue = useMemo(
    () => studentOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    [studentOrders]
  );

  const handleAddClick = () => {
    setFormData({
      id: "",
      studentId: `STU${Date.now().toString().slice(-6)}`,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      year: "",
      status: "Active",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setSubmitError("");
    setShowAddModal(true);
  };

  const handleEditClick = (student) => {
    setFormData({ ...student, password: "", confirmPassword: "" });
    setErrors({});
    setSubmitError("");
    setShowEditModal(true);
  };

  const handleViewClick = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleSaveAdd = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await createRegistration({
        studentId: formData.studentId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        year: formData.year,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: "student",
      });

      const registrations = await fetchRegistrations();
      setStudents(
        (registrations || [])
          .filter((user) => user.role === "student")
          .map((user) => ({
            id: user._id,
            studentId: user.studentId || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            department: user.department || "",
            year: user.year || "",
            status: user.Status || "Active",
          }))
      );
      setShowAddModal(false);
    } catch (error) {
      setSubmitError(error.message || "Failed to add student");
    }
  };

  const handleSaveEdit = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await updateRegistrationById(formData.id, {
        studentId: formData.studentId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        year: formData.year,
        role: "student",
      });

      setStudents((prev) =>
        prev.map((student) =>
          student.id === formData.id
            ? {
                ...student,
                studentId: formData.studentId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                department: formData.department,
                year: formData.year,
              }
            : student
        )
      );
      setShowEditModal(false);
    } catch (error) {
      setSubmitError(error.message || "Failed to update student");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteRegistrationById(id);
        setStudents((prev) => prev.filter((student) => student.id !== id));
      } catch (error) {
        setSubmitError(error.message || "Failed to delete student");
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

          <li className="active">
            <Link to="/manage-students">Manage Students</Link>
          </li>

          <li>
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

          <div>
            <Link className="back-link" to="/admin">← Back to Dashboard</Link>
            <h2>Manage Students</h2>
            <span className="sub-text">
              View and manage all registered students
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
            <p>Total Students</p>
            <h2>{students.length}</h2>
          </div>

          <div className="admin-card green">
            <p>Active Students</p>
            <h2>{students.filter(s => s.status === "Active").length}</h2>
          </div>

          <div className="admin-card purple">
            <p>Total Orders</p>
            <h2>{studentOrders.length}</h2>
          </div>

          <div className="admin-card green">
            <p>Total Revenue</p>
            <h2>{formatCurrency(totalRevenue)}</h2>
          </div>

        </div>


        {/* Filters */}
        <div className="table-filters">

          <input
            className="search-input"
            placeholder="Search by name, email, or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option>All Departments</option>
            {departmentOptions.map((department) => (
              <option key={department}>{department}</option>
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
          <button className="add-btn" onClick={handleAddClick}>+ Add New Student</button>
        </div>

        {loading && <p className="sub-text">Loading students from database...</p>}
        {submitError && <p className="error-message">{submitError}</p>}


        {/* Table */}
        <div className="orders-box">

          <table>

            <thead>
              <tr>
                <th>STUDENT ID</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.studentId}</td>
                  <td>{student.firstName} {student.lastName}</td>
                  <td>{student.email}</td>
                  <td>{student.phone}</td>
                  <td>{student.department}</td>
                  <td><span className={`badge ${student.status === "Active" ? "green" : "red"}`}>{student.status}</span></td>
                  <td>
                    <button className="view-btn" onClick={() => handleViewClick(student)}>View</button>
                    <button className="edit-btn" onClick={() => handleEditClick(student)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(student.id)}>Delete</button>
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
                <h3>Add New Student</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className={errors.firstName ? "input-error" : ""} />
                {errors.firstName && <span className="field-error">{errors.firstName}</span>}

                <input type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className={errors.lastName ? "input-error" : ""} />
                {errors.lastName && <span className="field-error">{errors.lastName}</span>}

                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={errors.email ? "input-error" : ""} />
                {errors.email && <span className="field-error">{errors.email}</span>}

                <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={errors.phone ? "input-error" : ""} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}

                <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={errors.password ? "input-error" : ""} />
                {errors.password && <span className="field-error">{errors.password}</span>}

                <input type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className={errors.confirmPassword ? "input-error" : ""} />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}

                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className={errors.department ? "input-error" : ""}>
                  <option>Select Department</option>
                  <option>Computer Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                  <option>Civil</option>
                </select>
                {errors.department && <span className="field-error">{errors.department}</span>}

                <select value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className={errors.year ? "input-error" : ""}>
                  <option>Select Year</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
                {errors.year && <span className="field-error">{errors.year}</span>}

                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveAdd}>Add Student</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Student</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <input type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className={errors.firstName ? "input-error" : ""} />
                {errors.firstName && <span className="field-error">{errors.firstName}</span>}

                <input type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className={errors.lastName ? "input-error" : ""} />
                {errors.lastName && <span className="field-error">{errors.lastName}</span>}

                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={errors.email ? "input-error" : ""} />
                {errors.email && <span className="field-error">{errors.email}</span>}

                <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={errors.phone ? "input-error" : ""} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}

                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className={errors.department ? "input-error" : ""}>
                  <option>Select Department</option>
                  <option>Computer Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                  <option>Civil</option>
                </select>
                {errors.department && <span className="field-error">{errors.department}</span>}

                <select value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className={errors.year ? "input-error" : ""}>
                  <option>Select Year</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
                {errors.year && <span className="field-error">{errors.year}</span>}

                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveEdit}>Update Student</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {showViewModal && selectedStudent && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Student Details</h3>
                <button className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
              </div>
              <div className="modal-body view-details">
                <div className="detail-row">
                  <label>Student ID:</label>
                  <span>{selectedStudent.studentId}</span>
                </div>
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedStudent.firstName} {selectedStudent.lastName}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedStudent.email}</span>
                </div>
                <div className="detail-row">
                  <label>Phone:</label>
                  <span>{selectedStudent.phone}</span>
                </div>
                <div className="detail-row">
                  <label>Department:</label>
                  <span>{selectedStudent.department}</span>
                </div>
                <div className="detail-row">
                  <label>Year:</label>
                  <span>{selectedStudent.year}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`badge ${selectedStudent.status === "Active" ? "green" : "red"}`}>{selectedStudent.status}</span>
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