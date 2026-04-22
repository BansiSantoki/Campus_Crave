import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  addItemToCart,
  clearCart,
  clearCurrentUser,
  getCart,
  getCurrentUser,
  getDisplayName,
  removeCartItem,
  setCart,
  updateCartItemQuantity,
} from "../../utils/appData";
import {
  createOrderRequest,
  createRazorpayOrderRequest,
  verifyRazorpayPaymentRequest,
} from "../../utils/orderApi";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
import { fetchMenuItems, fetchAllStalls } from "../../utils/stallApi";

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const ONLINE_PAYMENTS_ENABLED =
  String(import.meta.env.VITE_ENABLE_ONLINE_PAYMENTS || "true").toLowerCase() === "true";

const loadRazorpayCheckoutScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PlaceOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const userName = getDisplayName(user);

  const [pickupTime, setPickupTime] = useState("");
  const [contactNumber, setContactNumber] = useState(String(user?.phone || "").trim());
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(ONLINE_PAYMENTS_ENABLED ? "online" : "cash");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [cartItems, setCartItems] = useState(() => getCart(user));
  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadStalls = async () => {
      try {
        const data = await fetchAllStalls();
        if (!isMounted) return;

        const list = Array.isArray(data) ? data : [];
        setStalls(list);

        const cartStall = getCart(user)[0]?.stallId;
        const routeStall = location.state?.stallId;
        const fallbackStall = list[0]?._id || list[0]?.id || "";
        const nextStallId = String(cartStall || routeStall || fallbackStall || "");
        setSelectedStallId(nextStallId);
      } catch {
        if (!isMounted) return;
        setStalls([]);
      }
    };

    loadStalls();

    return () => {
      isMounted = false;
    };
  }, [location.state?.stallId, user]);

  useEffect(() => {
    // Auto-lock stall from cart so user doesn't need to select it manually.
    const cartStallId = cartItems[0]?.stallId;
    if (cartStallId && String(cartStallId) !== String(selectedStallId)) {
      setSelectedStallId(String(cartStallId));
      setSelectedItemId("");
    }
  }, [cartItems, selectedStallId]);

  useEffect(() => {
    let isMounted = true;

    const loadMenuItems = async () => {
      try {
        const items = await fetchMenuItems(selectedStallId || undefined);
        if (!isMounted) return;
        setMenuItems(Array.isArray(items) ? items : []);
      } catch {
        if (!isMounted) return;
        setMenuItems([]);
      }
    };

    loadMenuItems();

    return () => {
      isMounted = false;
    };
  }, [selectedStallId]);

  const selectedStall = useMemo(
    () => stalls.find((stall) => String(stall._id || stall.id) === String(selectedStallId)) || null,
    [selectedStallId, stalls],
  );

  const activeStall = useMemo(() => {
    if (selectedStall) return selectedStall;

    const cartStallId = cartItems[0]?.stallId;
    if (cartStallId) {
      const byCartStall = stalls.find((stall) => String(stall._id || stall.id) === String(cartStallId));
      if (byCartStall) return byCartStall;
    }

    return stalls[0] || null;
  }, [cartItems, selectedStall, stalls]);

  useEffect(() => {
    // Backfill missing stallId in legacy cart items so order placement never breaks.
    if (!activeStall || cartItems.length === 0) return;

    const resolvedStallId = String(activeStall._id || activeStall.id || "");
    const needsBackfill = cartItems.some((item) => !item.stallId);

    if (needsBackfill) {
      const patched = cartItems.map((item) => ({
        ...item,
        stallId: item.stallId || resolvedStallId,
      }));
      setCart(user, patched);
      setCartItems(patched);
    }
  }, [activeStall, cartItems, user]);

  useEffect(() => {
    if (!ONLINE_PAYMENTS_ENABLED && paymentMethod === "online") {
      setPaymentMethod("cash");
    }
  }, [paymentMethod]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cartItems],
  );
  const tax = Number((subtotal * 0.05).toFixed(2));
  const totalAmount = Number((subtotal + tax).toFixed(2));
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems],
  );

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  const validateForm = () => {
    const newErrors = {};
    const normalizedContactNumber = String(contactNumber || user?.phone || "").trim().replace(/[^\d+]/g, "");

    if (cartItems.length === 0) {
      newErrors.cart = "Cart is empty. Add at least one item.";
    }

    if (!activeStall) {
      newErrors.stall = "No stall found. Please add items from a stall menu first.";
    }

    if (!pickupTime) {
      newErrors.pickupTime = "Please select a pickup time";
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }

    if (!normalizedContactNumber) {
      newErrors.contactNumber = "Please enter a WhatsApp phone number";
    } else {
      const digitsOnly = normalizedContactNumber.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        newErrors.contactNumber = "Enter a valid phone number with 10 to 15 digits";
      }
    }

    if (specialInstructions && specialInstructions.length > 200) {
      newErrors.specialInstructions = "Special instructions must be less than 200 characters";
    }

    return newErrors;
  };

  const handleAddItem = () => {
    if (!selectedItemId) return;
    const item = menuItems.find((entry) => String(entry._id || entry.id) === String(selectedItemId));
    if (!item || !activeStall) return;

    const result = addItemToCart(user, {
      id: item._id || item.id,
      name: item.name,
      price: Number(item.price || 0),
      category: item.category,
      stallId: activeStall._id || activeStall.id,
    }, Number(selectedQty || 1));

    if (!result.success) {
      alert(result.message || "Unable to add item");
      return;
    }

    setCartItems(getCart(user));
  };

  const handlePlaceOrder = async (e) => {
    e?.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0 || !activeStall) {
      return;
    }

    try {
      setSubmitting(true);
      const isOnlinePaymentMethod = paymentMethod === "online";
      if (isOnlinePaymentMethod && !ONLINE_PAYMENTS_ENABLED) {
        throw new Error("Online payment is not configured right now. Please choose Cash on Pickup or Campus Wallet.");
      }
      const normalizedContactNumber = String(contactNumber || user?.phone || "").trim().replace(/[^\d+]/g, "");
      const paymentStatus = isOnlinePaymentMethod
        ? "Pending"
        : paymentMethod === "wallet"
        ? "Completed"
        : "Pending";

      const payload = {
        studentId: user?.studentId || "N/A",
        studentName: userName,
        studentEmail: user?.email || "",
        studentPhone: normalizedContactNumber,
        stallId: String(activeStall._id || activeStall.id),
        stallName: activeStall.stallName,
        stallOwner: activeStall.owner || "N/A",
        items: cartItems.map((item) => ({
          itemId: item.id,
          itemName: item.name,
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
          totalPrice: Number(item.price || 0) * Number(item.quantity || 0),
        })),
        totalItems,
        subtotal,
        tax,
        totalAmount,
        pickupTime,
        paymentMethod,
        paymentStatus,
        paymentReference: "",
        specialInstructions,
      };

      const result = await createOrderRequest(payload);
      if (!result.success) {
        throw new Error("Failed to place order");
      }

      if (isOnlinePaymentMethod) {
        const scriptReady = await loadRazorpayCheckoutScript();
        if (!scriptReady) {
          throw new Error("Unable to load Razorpay checkout. Please try again.");
        }

        const razorpayOrder = await createRazorpayOrderRequest(result.orderId);

        const paymentResult = await new Promise((resolve) => {
          const options = {
            key: razorpayOrder.keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "Campus Crave",
            description: `Order ${result.orderId}`,
            order_id: razorpayOrder.razorpayOrderId,
            prefill: {
              name: razorpayOrder.customer?.name || userName,
              email: razorpayOrder.customer?.email || user?.email || "",
              contact: razorpayOrder.customer?.contact || user?.phone || "",
            },
            handler: async (response) => {
              try {
                const verified = await verifyRazorpayPaymentRequest({
                  orderId: result.orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                resolve({ success: true, data: verified });
              } catch (verifyError) {
                resolve({
                  success: false,
                  error: verifyError?.message || "Payment verification failed",
                });
              }
            },
            modal: {
              ondismiss: () => resolve({ success: false, error: "Payment cancelled by user" }),
            },
            theme: {
              color: "#0f8f57",
            },
          };

          const checkout = new window.Razorpay(options);
          checkout.on("payment.failed", (failure) => {
            const reason =
              failure?.error?.description ||
              failure?.error?.reason ||
              failure?.error?.code ||
              "Payment failed";
            resolve({ success: false, error: reason });
          });
          checkout.open();
        });

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || "Payment was not completed");
        }
      }

      clearCart(user);
      setCartItems([]);

      if (result.orderId) {
        const billUrl = `${API_BASE}/orders/${encodeURIComponent(result.orderId)}/bill?t=${Date.now()}`;
        window.open(billUrl, "_blank", "noopener,noreferrer");
      }

      const statusLine = result.whatsappSent
        ? `WhatsApp bill sent to ${result.whatsappTarget || "your number"}.`
        : `WhatsApp update: ${result.whatsappError || result.whatsappMessage || "will be sent shortly"}`;

      alert(`Order placed successfully! ${statusLine}`);
      navigate("/orders");
    } catch (error) {
      setErrors({ submit: error.message || "Failed to place order" });
    } finally {
      setSubmitting(false);
    }
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
          <li><Link to="/menu">Browse Menu</Link></li>
           <li className="active"><Link to="/cart">View Cart ({getCart(user).reduce((s, i) => s + (i.quantity || 0), 0)})</Link></li>
           <li><Link to="/orders">My Orders</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <Link className="back-link" to="/menu">← Back to Menu</Link>
            <h2>Place Order</h2>
            <span className="sub-text">Review your cart and complete your order</span>
          </div>

          <div className="user-box">
            <div className="user-details">
              <p>{userName}</p>
              <span>{user?.studentId ? `Student ID: ${user.studentId}` : user?.email || "Student"}</span>
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {errors.submit && <p className="error-message">{errors.submit}</p>}
        {errors.cart && <p className="error-message">{errors.cart}</p>}

        <div className="order-layout">
          <div className="cart-box">
            <h3>{`Cart Items (${totalItems})`}</h3>

            {cartItems.length === 0 && <p className="sub-text">Cart is empty. Add items below.</p>}

            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-info">
                  <div className="cart-img">🍽️</div>
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.category || "Menu Item"}</p>
                    <span className="price">{`Rs. ${Number(item.price || 0).toFixed(2)}`}</span>
                  </div>
                </div>

                <div className="cart-actions">
                  <div className="qty-box">
                    <button onClick={() => {
                      updateCartItemQuantity(user, item.id, Number(item.quantity || 1) - 1);
                      setCartItems(getCart(user));
                    }}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => {
                      updateCartItemQuantity(user, item.id, Number(item.quantity || 1) + 1);
                      setCartItems(getCart(user));
                    }}>+</button>
                  </div>
                  <button className="delete-btn" onClick={() => {
                    removeCartItem(user, item.id);
                    setCartItems(getCart(user));
                  }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="order-side">
            <div className="pickup-box">
              <h3>Pickup Details</h3>

              <label>Selected Stall</label>
              <p className="sub-text" style={{ marginBottom: "4px" }}>
                {activeStall?.stallName || "No stall selected"}
              </p>
              {activeStall && <small className="sub-text">Auto selected from your cart</small>}
              {errors.stall && <span className="field-error">{errors.stall}</span>}

              <label>Add Items</label>
              <div className="row">
                <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
                  <option value="">-- Select Item --</option>
                  {menuItems.map((item) => (
                    <option key={item._id || item.id} value={String(item._id || item.id)}>
                      {`${item.name} - Rs. ${Number(item.price || 0).toFixed(2)}`}
                    </option>
                  ))}
                </select>
                <select value={selectedQty} onChange={(e) => setSelectedQty(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((qty) => (
                    <option key={qty} value={qty}>{`Qty: ${qty}`}</option>
                  ))}
                </select>
              </div>
              <button className="view-btn" onClick={handleAddItem}>Add to Cart</button>

              <label>Preferred Pickup Time</label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className={errors.pickupTime ? "input-error" : ""}
              >
                <option value="">-- Select Pickup Time --</option>
                <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                <option value="12:00 PM - 12:30 PM">12:00 PM - 12:30 PM</option>
                <option value="1:00 PM - 1:30 PM">1:00 PM - 1:30 PM</option>
                <option value="2:00 PM - 2:30 PM">2:00 PM - 2:30 PM</option>
              </select>
              {errors.pickupTime && <span className="field-error">{errors.pickupTime}</span>}

              <label>WhatsApp Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your phone number for bill delivery"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className={errors.contactNumber ? "input-error" : ""}
              />
              {errors.contactNumber && <span className="field-error">{errors.contactNumber}</span>}
              <small className="sub-text">Bill PDF and WhatsApp notification will be sent to this number.</small>

              <label>Special Instructions (Optional)</label>
              <textarea
                placeholder="E.g., Extra spicy, No onions..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                maxLength="200"
                className={errors.specialInstructions ? "input-error" : ""}
              />
              {errors.specialInstructions && <span className="field-error">{errors.specialInstructions}</span>}
              <small>{`${specialInstructions.length}/200 characters`}</small>
            </div>

            <div className="summary-box">
              <h3>Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{`Rs. ${subtotal.toFixed(2)}`}</span>
              </div>

              <div className="summary-row">
                <span>Tax (5%)</span>
                <span>{`Rs. ${tax.toFixed(2)}`}</span>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>{`Rs. ${totalAmount.toFixed(2)}`}</span>
              </div>

              <div className="payment-method">
                <p>Payment Method</p>
                {errors.paymentMethod && <span className="field-error">{errors.paymentMethod}</span>}
                {ONLINE_PAYMENTS_ENABLED ? (
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
                ) : (
                  <p className="sub-text" style={{ marginBottom: "10px", color: "#b45309" }}>
                    Online payment is temporarily disabled. Use Cash on Pickup or Campus Wallet.
                  </p>
                )}
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

              <button className="place-order-btn" onClick={handlePlaceOrder} disabled={submitting}>
                {submitting ? "Processing..." : paymentMethod === "online" ? "Pay & Place Order" : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
