import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";

export default function PlaceOrder() {
    const navigate = useNavigate();
    const [pickupTime, setPickupTime] = useState("");
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("online");
    const [errors, setErrors] = useState({});

const handleLogout = () => {
  // Optional: Clear localStorage or session
  localStorage.removeItem("user");

  // Redirect to login
  navigate("/");
};

const validateForm = () => {
  const newErrors = {};

  // Pickup time validation
  if (!pickupTime) {
    newErrors.pickupTime = "Please select a pickup time";
  }

  // Payment method validation
  if (!paymentMethod) {
    newErrors.paymentMethod = "Please select a payment method";
  }

  // Special instructions validation (optional but max length check)
  if (specialInstructions && specialInstructions.length > 200) {
    newErrors.specialInstructions = "Special instructions must be less than 200 characters";
  }

  return newErrors;
};

const handlePlaceOrder = (e) => {
  e?.preventDefault();
  const newErrors = validateForm();
  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    return;
  }

  // Process order
  alert("Order placed successfully!");
  navigate("/student");
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
          <li><Link to="/student">Dashboard</Link></li>
          <li><Link to="/stalls">View Stalls</Link></li>
          <li><Link to="/menu">Browse Menu</Link></li>
          <li className="active"><Link to="/orders">My Orders</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
      </aside>

      {/* MAIN */}
      <main className="main">

        <div className="header">
          <div>
            <p className="back-link">← Back to Menu</p>
            <h2>Place Order</h2>
            <span className="sub-text">
              Review your cart and complete your order
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

        

        <div className="order-layout">

          {/* LEFT - CART ITEMS */}
          <div className="cart-box">
            <h3>Cart Items (3)</h3>

            {/* Cart Item */}
            <div className="cart-item">
              <div className="cart-info">
                <div className="cart-img">🍽️</div>
                <div>
                  <h4>Masala Dosa</h4>
                  <p>South Indian Stall</p>
                  <span className="price">₹50</span>
                </div>
              </div>

              <div className="cart-actions">
                <div className="qty-box">
                  <button>-</button>
                  <span>2</span>
                  <button>+</button>
                </div>
                <button className="delete-btn">🗑</button>
              </div>
            </div>

            <div className="cart-item">
              <div className="cart-info">
                <div className="cart-img">🥤</div>
                <div>
                  <h4>Cold Coffee</h4>
                  <p>Juice Corner</p>
                  <span className="price">₹50</span>
                </div>
              </div>

              <div className="cart-actions">
                <div className="qty-box">
                  <button>-</button>
                  <span>1</span>
                  <button>+</button>
                </div>
                <button className="delete-btn">🗑</button>
              </div>
            </div>

            <div className="cart-item">
              <div className="cart-info">
                <div className="cart-img">🍔</div>
                <div>
                  <h4>Veg Burger</h4>
                  <p>Fast Food Corner</p>
                  <span className="price">₹60</span>
                </div>
              </div>

              <div className="cart-actions">
                <div className="qty-box">
                  <button>-</button>
                  <span>1</span>
                  <button>+</button>
                </div>
                <button className="delete-btn">🗑</button>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="order-side">

            {/* Pickup Details */}
            <div className="pickup-box">
              <h3>Pickup Details</h3>

              <label>Preferred Pickup Time</label>
              <select 
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className={errors.pickupTime ? "input-error" : ""}
              >
                <option value="">-- Select Pickup Time --</option>
                <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                <option value="12:00 PM - 12:30 PM">12:00 PM - 12:30 PM</option>
              </select>
              {errors.pickupTime && <span className="field-error">{errors.pickupTime}</span>}

              <label>Special Instructions (Optional)</label>
              <textarea 
                placeholder="E.g., Extra spicy, No onions..." 
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                maxLength="200"
                className={errors.specialInstructions ? "input-error" : ""}
              />
              {errors.specialInstructions && <span className="field-error">{errors.specialInstructions}</span>}
              <small>{specialInstructions.length}/200 characters</small>
            </div>

            {/* Order Summary */}
            <div className="summary-box">
              <h3>Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹210</span>
              </div>

              <div className="summary-row">
                <span>Tax (5%)</span>
                <span>₹10.50</span>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>₹220.50</span>
              </div>

              <div className="payment-method">
                <p>Payment Method</p>
                {errors.paymentMethod && <span className="field-error">{errors.paymentMethod}</span>}
                <label>
                  <input 
                    type="radio" 
                    name="pay" 
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  /> 
                  UPI / Online Payment
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="pay"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  /> 
                  Cash on Pickup
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="pay"
                    value="wallet"
                    checked={paymentMethod === "wallet"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  /> 
                  Campus Wallet
                </label>
              </div>

              <button className="place-order-btn" onClick={handlePlaceOrder}>Place Order</button>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}