import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser, getDisplayName, getCart } from "../../utils/appData";
import { fetchAllStalls } from "../../utils/stallApi";
import { fetchReviews, submitReview } from "../../utils/reviewApi";

export default function ViewStalls() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userName = getDisplayName(user);
  const cartCount = getCart(user).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const [stalls, setStalls] = useState([]);
  const [reviewsByStall, setReviewsByStall] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewErrors, setReviewErrors] = useState({});
  const [submittingReviewFor, setSubmittingReviewFor] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStalls = async () => {
      try {
        setLoading(true);
        const [stallData, reviewData] = await Promise.all([fetchAllStalls(), fetchReviews()]);
        if (!isMounted) return;

        const normalizedStalls = Array.isArray(stallData) ? stallData : [];
        setStalls(normalizedStalls);

        const groupedReviews = (Array.isArray(reviewData) ? reviewData : []).reduce((acc, review) => {
          const key = String(review.stallId || "");
          if (!key) return acc;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(review);
          return acc;
        }, {});

        setReviewsByStall(groupedReviews);

        const drafts = {};
        const userEmail = String(user?.email || "").toLowerCase();
        normalizedStalls.forEach((stall) => {
          const stallId = String(stall._id || stall.id || "");
          const existingReview = (groupedReviews[stallId] || []).find(
            (entry) => String(entry.studentEmail || "").toLowerCase() === userEmail,
          );
          drafts[stallId] = {
            rating: existingReview ? String(existingReview.rating || "") : "",
            review: existingReview ? String(existingReview.review || "") : "",
          };
        });

        // Keep in-progress user input during polling refresh.
        setReviewDrafts((prev) => {
          const next = {};
          normalizedStalls.forEach((stall) => {
            const stallId = String(stall._id || stall.id || "");
            next[stallId] = prev[stallId] ?? drafts[stallId] ?? { rating: "", review: "" };
          });
          return next;
        });
      } catch {
        if (!isMounted) return;
        setStalls([]);
        setReviewsByStall({});
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStalls();
    const intervalId = setInterval(loadStalls, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleReviewChange = (stallId, field, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [stallId]: {
        rating: prev[stallId]?.rating || "",
        review: prev[stallId]?.review || "",
        [field]: value,
      },
    }));

    setReviewErrors((prev) => ({
      ...prev,
      [stallId]: "",
    }));
  };

  const handleSubmitReview = async (stall) => {
    const stallId = String(stall._id || stall.id || "");
    const draft = reviewDrafts[stallId] || { rating: "", review: "" };
    const rating = Number(draft.rating || 0);
    const review = String(draft.review || "").trim();

    if (!stallId || !user?.email) {
      setReviewErrors((prev) => ({
        ...prev,
        [stallId]: "Unable to submit review. Please login again.",
      }));
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setReviewErrors((prev) => ({
        ...prev,
        [stallId]: "Please select a rating between 1 and 5.",
      }));
      return;
    }

    try {
      setSubmittingReviewFor(stallId);
      setReviewErrors((prev) => ({
        ...prev,
        [stallId]: "",
      }));

      const result = await submitReview({
        stallId,
        stallName: stall.stallName || "Campus Stall",
        studentEmail: String(user.email || "").toLowerCase(),
        studentName: userName,
        rating,
        review,
      });

      const savedReview = result?.review;
      if (savedReview) {
        setReviewsByStall((prev) => {
          const current = Array.isArray(prev[stallId]) ? prev[stallId] : [];
          const withoutCurrentUser = current.filter(
            (entry) => String(entry.studentEmail || "").toLowerCase() !== String(user.email || "").toLowerCase(),
          );
          return {
            ...prev,
            [stallId]: [savedReview, ...withoutCurrentUser],
          };
        });
      }

      const summary = result?.summary || {};
      setStalls((prev) =>
        prev.map((entry) =>
          String(entry._id || entry.id) === stallId
            ? {
                ...entry,
                rating: Number(summary.averageRating || entry.rating || 0),
                reviewsCount: Number(summary.totalReviews || entry.reviewsCount || 0),
              }
            : entry,
        ),
      );
    } catch (error) {
      setReviewErrors((prev) => ({
        ...prev,
        [stallId]: error.message || "Failed to submit review",
      }));
    } finally {
      setSubmittingReviewFor("");
    }
  };

  const filteredStalls = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stalls.filter((stall) => {
      const matchesSearch =
        !query ||
        String(stall.stallName || "").toLowerCase().includes(query) ||
        String(stall.owner || "").toLowerCase().includes(query) ||
        String(stall.cuisine || "").toLowerCase().includes(query);

      const isOpen = String(stall.status || "").toLowerCase() === "active";
      const rating = Number(stall.rating || 0);

      if (filter === "open") return matchesSearch && isOpen;
      if (filter === "top") return matchesSearch && rating >= 4.5;
      return matchesSearch;
    });
  }, [filter, search, stalls]);

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
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
          <li className="active"><Link to="/stalls">View Stalls</Link></li>
          <li><Link to="/menu">Browse Menu</Link></li>
          <li><Link to="/cart">View Cart ({cartCount})</Link></li>
          <li><Link to="/orders">My Orders</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <Link className="back-link" to="/student">← Back to Dashboard</Link>
            <h2>Campus Stalls</h2>
            <span className="sub-text">Browse all available food stalls on campus</span>
          </div>

          <div className="user-box">
            <div className="user-details">
              <p>{userName}</p>
              <span>{user?.studentId ? `Student ID: ${user.studentId}` : user?.email || "Student"}</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="stall-filter">
          <input
            type="text"
            placeholder="Search stalls by name, owner, cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-buttons">
            <button onClick={() => setFilter("all")} className={filter === "all" ? "active-cat" : ""}>All Stalls</button>
            <button onClick={() => setFilter("open")} className={filter === "open" ? "active-cat" : ""}>Open Now</button>
            <button onClick={() => setFilter("top")} className={filter === "top" ? "active-cat" : ""}>Top Rated</button>
          </div>
        </div>

        {loading && <p className="sub-text">Loading stalls...</p>}

        <div className="stall-grid">
          {filteredStalls.map((stall) => {
            const isOpen = String(stall.status || "").toLowerCase() === "active";
            return (
              <div className="stall-card" key={stall._id || stall.id}>
                <div className="stall-top">
                  <h3>{stall.stallName}</h3>
                  <span className={`open-badge ${isOpen ? "" : "gray"}`}>{isOpen ? "Open" : "Closed"}</span>
                </div>

                <p>{`Owner: ${stall.owner || "N/A"}`}</p>
                <p>{`⭐ ${Number(stall.rating || 0).toFixed(1)} · ${Number(stall.reviewsCount || 0)} reviews · ${Number(stall.ordersCount || 0)} orders`}</p>
                <p className="category-tag">{stall.cuisine || "General"}</p>
                <p>{`⏰ ${stall.hours || "N/A"}`}</p>

                <div className="cart-section" style={{ marginTop: "10px", flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
                  <select
                    value={reviewDrafts[String(stall._id || stall.id)]?.rating || ""}
                    onChange={(e) => handleReviewChange(String(stall._id || stall.id), "rating", e.target.value)}
                  >
                    <option value="">Rate this stall</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Average</option>
                    <option value="1">1 - Poor</option>
                  </select>

                  <textarea
                    placeholder="Write your review (optional)"
                    value={reviewDrafts[String(stall._id || stall.id)]?.review || ""}
                    onChange={(e) => handleReviewChange(String(stall._id || stall.id), "review", e.target.value)}
                    rows={2}
                    style={{ width: "100%", borderRadius: "10px", border: "1px solid #cfe7d8", padding: "8px" }}
                  />

                  <button
                    className="add-cart"
                    onClick={() => handleSubmitReview(stall)}
                    disabled={submittingReviewFor === String(stall._id || stall.id)}
                  >
                    {submittingReviewFor === String(stall._id || stall.id) ? "Submitting..." : "Submit Review"}
                  </button>
                </div>

                {reviewErrors[String(stall._id || stall.id)] && (
                  <p className="sub-text" style={{ color: "#b42318" }}>
                    {reviewErrors[String(stall._id || stall.id)]}
                  </p>
                )}

                <div className="specialties">
                  {(reviewsByStall[String(stall._id || stall.id)] || []).slice(0, 2).map((entry) => (
                    <span key={entry._id}>{`⭐${entry.rating} ${entry.studentName}: ${entry.review || "Great food"}`}</span>
                  ))}
                  {(reviewsByStall[String(stall._id || stall.id)] || []).length === 0 && (stall.specialties || []).slice(0, 2).map((spec) => (
                    <span key={spec}>{spec}</span>
                  ))}
                  {(reviewsByStall[String(stall._id || stall.id)] || []).length === 0 && (!stall.specialties || stall.specialties.length === 0) && <span>No reviews yet</span>}
                </div>

                <div className="stall-buttons">
                  <button
                    className="view-btn"
                    onClick={() => navigate("/menu", { state: { stallId: String(stall._id || stall.id) } })}
                  >
                    View Menu
                  </button>
                  <button
                    className="order-btn"
                    onClick={() => navigate("/cart", { state: { stallId: String(stall._id || stall.id) } })}
                  >
                    Order Now
                  </button>
                </div>
              </div>
            );
          })}

          {!loading && filteredStalls.length === 0 && (
            <div className="stall-card">
              <h3>No stalls found</h3>
              <p>Try changing your search or filter.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
