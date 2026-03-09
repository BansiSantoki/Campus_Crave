import { Link,useNavigate } from "react-router-dom";

export default function BrowseMenu() {
    const navigate = useNavigate();

const handleLogout = () => {
  // Optional: Clear localStorage or session
  localStorage.removeItem("user");

  // Redirect to login
  navigate("/");
};
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
          <li>
            <Link to="/student">Dashboard</Link>
          </li>
          <li>
            <Link to="/stalls">View Stalls</Link>
          </li>
          <li className="active">
            <Link to="/menu">Browse Menu</Link>
          </li>
          <li>
            <Link to="/orders">My Orders</Link>
          </li>
          <li>
            <Link to="/profile">Profile</Link>
          </li>
        </ul>
      </aside>

      {/* MAIN */}
      <main className="main">

        {/* Header */}
        <div className="header">
          <div>
            <p className="back-link">← Back to Dashboard</p>
            <h2>Browse Menu</h2>
            <span className="sub-text">
              Order your favorite food from campus stalls
            </span>
            
          </div>
          <div className="user-box">
            <div className="user-details">
              <p>John Doe</p>
              <span>Student ID: STU2024001</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Search */}
        <div className="menu-search">
          <input type="text" placeholder="Search for food items..." />
          <button className="search-btn">Search</button>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          <p>Filter by Category:</p>
          <div className="category-buttons">
            <button className="active-cat">All Items</button>
            <button>South Indian</button>
            <button>North Indian</button>
            <button>Beverages</button>
            <button>Snacks</button>
            <button>Desserts</button>
          </div>
        </div>

        {/* Food Grid */}
        <div className="food-grid">

          {/* Food Card */}
          <div className="food-card">
            <div className="food-image">🥞</div>
            <div className="food-content">
              <div className="food-title">
                <h3>Masala Dosa</h3>
                <span className="price">₹50</span>
              </div>
              <p>South Indian Stall</p>

              <div className="tags">
                <span className="tag south">South Indian</span>
                <span className="tag available">Available</span>
              </div>

              <div className="cart-section">
                <select>
                  <option>Qty: 1</option>
                  <option>Qty: 2</option>
                  <option>Qty: 3</option>
                </select>
                <button className="add-cart">Add to Cart</button>
              </div>
            </div>
          </div>

          {/* Repeat Cards */}
          <div className="food-card">
            <div className="food-image">🍚</div>
            <div className="food-content">
              <div className="food-title">
                <h3>Idli Sambar</h3>
                <span className="price">₹40</span>
              </div>
              <p>South Indian Stall</p>
              <div className="tags">
                <span className="tag south">South Indian</span>
                <span className="tag available">Available</span>
              </div>
              <div className="cart-section">
                <select>
                  <option>Qty: 1</option>
                </select>
                <button className="add-cart">Add to Cart</button>
              </div>
            </div>
          </div>

          <div className="food-card">
            <div className="food-image">🍔</div>
            <div className="food-content">
              <div className="food-title">
                <h3>Veg Burger</h3>
                <span className="price">₹60</span>
              </div>
              <p>Fast Food Corner</p>
              <div className="tags">
                <span className="tag snack">Snacks</span>
                <span className="tag available">Available</span>
              </div>
              <div className="cart-section">
                <select>
                  <option>Qty: 1</option>
                </select>
                <button className="add-cart">Add to Cart</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}