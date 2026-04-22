import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  addItemToCart,
  clearCurrentUser,
  getCurrentUser,
  getDisplayName,
  getCart,
  getFoodFallbackImage,
  getFoodImage,
} from "../../utils/appData";
import { fetchAllStalls, fetchMenuItems } from "../../utils/stallApi";

export default function BrowseMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const userName = getDisplayName(currentUser);
  const cartCount = getCart(currentUser).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [selectedStallId, setSelectedStallId] = useState("");
  const [stalls, setStalls] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStalls = async () => {
      try {
        const list = await fetchAllStalls();
        if (!isMounted) return;

        const normalized = Array.isArray(list) ? list : [];
        setStalls(normalized);

        const routeStallId = location.state?.stallId;
        const fallbackStallId = normalized[0]?._id || normalized[0]?.id || "";
        setSelectedStallId(String(routeStallId || fallbackStallId || ""));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStalls();
    return () => {
      isMounted = false;
    };
  }, [location.state?.stallId]);

  useEffect(() => {
    let isMounted = true;

    const loadMenu = async () => {
      setLoading(true);
      try {
        const list = await fetchMenuItems(selectedStallId || undefined);
        if (!isMounted) return;
        setMenuItems(Array.isArray(list) ? list : []);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMenu();
    return () => {
      isMounted = false;
    };
  }, [selectedStallId]);

  useEffect(() => {
    // Keep filter state predictable when switching stalls.
    setSelectedCategory("All Items");
  }, [selectedStallId]);

  const categories = useMemo(() => {
    const list = [
      ...new Set(
        menuItems
          .map((item) => String(item.category || "").trim())
          .filter(Boolean)
      ),
    ];
    return ["All Items", ...list];
  }, [menuItems]);

  const stallNameMap = useMemo(() => {
    const map = new Map();
    stalls.forEach((stall) => {
      map.set(String(stall._id || stall.id), stall.stallName || "Campus Stall");
    });
    return map;
  }, [stalls]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedSelectedCategory = String(selectedCategory || "").trim().toLowerCase();

    return menuItems.filter((item) => {
      const itemStallId = String(item.stallId || item.stall?._id || item.stall || "");
      const matchesStall = !selectedStallId || itemStallId === String(selectedStallId);
      const normalizedItemCategory = String(item.category || "").trim().toLowerCase();
      const matchesCategory =
        normalizedSelectedCategory === "all items" ||
        normalizedItemCategory === normalizedSelectedCategory;
      const stallLabel = stallNameMap.get(itemStallId) || "";
      const matchesQuery =
        !query ||
        String(item.name || "").toLowerCase().includes(query) ||
        String(item.category || "").toLowerCase().includes(query) ||
        stallLabel.toLowerCase().includes(query);

      return matchesStall && matchesCategory && matchesQuery;
    });
  }, [menuItems, searchQuery, selectedCategory, selectedStallId, stallNameMap]);

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  const handleAddToCart = (item) => {
    const quantity = Number(quantities[item._id || item.id] || 1);
    const normalizedStallId = String(item.stallId || item.stall?._id || item.stall || selectedStallId);

    const result = addItemToCart(
      currentUser,
      {
        id: item._id || item.id,
        name: item.name,
        price: Number(item.price || 0),
        category: item.category,
        stallId: normalizedStallId,
      },
      quantity,
    );

    if (!result.success) {
      alert(result.message || "Unable to add item");
      return;
    }

    alert("Item added to cart");
  };

  return (
    <div className="dashboard-container">
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
          <li className="active"><Link to="/menu">Browse Menu</Link></li>
          <li><Link to="/cart">View Cart ({cartCount})</Link></li>
          <li><Link to="/orders">My Orders</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <Link className="back-link" to="/student">← Back to Dashboard</Link>
            <h2>Browse Menu</h2>
            <span className="sub-text">Search food, filter categories, and add items to cart</span>
          </div>

          <div className="user-box">
            <div className="user-details">
              <p>{userName}</p>
              <span>{currentUser?.studentId ? `Student ID: ${currentUser.studentId}` : currentUser?.email || "Student"}</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="menu-search">
          <input
            type="text"
            placeholder="Search by dish, category, or stall..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setSearchQuery(e.target.value);
            }}
          />
          <button className="search-btn" onClick={() => setSearchQuery(searchInput)}>
            Search
          </button>
        </div>

        <div className="category-filter">
          <p>Filter by Stall:</p>
          <div className="cart-section" style={{ marginBottom: "12px" }}>
            <select value={selectedStallId} onChange={(e) => setSelectedStallId(e.target.value)}>
              <option value="">All Stalls</option>
              {stalls.map((stall) => (
                <option key={stall._id || stall.id} value={String(stall._id || stall.id)}>
                  {stall.stallName}
                </option>
              ))}
            </select>
            <button className="view-btn" onClick={() => navigate("/cart", { state: { stallId: selectedStallId } })}>
              Go to Cart
            </button>
          </div>

          <p>Filter by Category:</p>
          <div className="category-buttons">
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? "active-cat" : ""}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="sub-text">Loading menu...</p>}

        <div className="food-grid">
          {filteredItems.map((item) => {
            const itemId = item._id || item.id;
            const itemStallId = String(item.stallId || item.stall?._id || item.stall || "");
            const stallName = stallNameMap.get(itemStallId) || "Campus Stall";

            return (
              <div className="food-card" key={itemId}>
                <div className="food-image">
                  <img
                    src={getFoodImage(item)}
                    alt={item.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = getFoodFallbackImage(item.category);
                    }}
                  />
                </div>

                <div className="food-content">
                  <div className="food-title">
                    <h3>{item.name}</h3>
                    <span className="price">{`Rs. ${Number(item.price || 0).toFixed(0)}`}</span>
                  </div>

                  <p>{stallName}</p>

                  <div className="tags">
                    <span className="tag south">{item.category || "General"}</span>
                    <span className="tag available">{item.status || "Available"}</span>
                  </div>

                  <div className="cart-section">
                    <select
                      value={quantities[itemId] || 1}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [itemId]: Number(e.target.value),
                        }))
                      }
                    >
                      {[1, 2, 3, 4, 5].map((qty) => (
                        <option key={qty} value={qty}>{`Qty: ${qty}`}</option>
                      ))}
                    </select>
                    <button className="add-cart" onClick={() => handleAddToCart(item)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && filteredItems.length === 0 && (
            <div className="food-card">
              <div className="food-content">
                <h3>No items found</h3>
                <p className="sub-text">Try changing stall/category filter or search text.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}