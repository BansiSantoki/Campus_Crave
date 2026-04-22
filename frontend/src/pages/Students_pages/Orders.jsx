import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ensureAppData,
  getCurrentUser
} from "../../utils/appData";
import { fetchOrdersByStudent } from "../../utils/orderApi";

export default function Orders() {
  ensureAppData();

  const currentUser = getCurrentUser();
  const [studentOrders, setStudentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      setLoading(true);
      const result = await fetchOrdersByStudent(currentUser?.email);
      if (isMounted) {
        setStudentOrders(result.orders || []);
        setLoading(false);
      }
    };

    loadOrders();
    const intervalId = setInterval(loadOrders, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [currentUser?.email]);

  return (
    <>
      <div className="header">
        <div>
          <Link className="back-link" to="/student">← Back to Dashboard</Link>
          <h2>My Orders</h2>
          <span className="sub-text">Track your placed orders and current status</span>
        </div>
      </div>

        <div className="orders-box">
          <div className="panel-head">
            <h3>Order History ({studentOrders.length})</h3>
            {loading && <span className="status-chip">Syncing...</span>}
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>STALL</th>
                  <th>ITEMS</th>
                  <th>TOTAL</th>
                  <th>PICKUP TIME</th>
                  <th>STATUS</th>
                  <th>BILL</th>
                </tr>
              </thead>

              <tbody>
                {studentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.stallName}</td>
                    <td>{order.items.map((item) => `${item.itemName || item.name} x${item.quantity}`).join(", ")}</td>
                    <td>{`Rs. ${Number(order.totalAmount).toFixed(2)}`}</td>
                    <td>{order.pickupTime}</td>
                    <td>
                      <span
                        className={`badge ${
                          order.status === "Ready"
                            ? "green"
                            : order.status === "Preparing" || order.status === "New"
                            ? "orange"
                            : "gray"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.billPdfUrl ? (
                        <a className="view-btn" href={order.billPdfUrl} target="_blank" rel="noreferrer">
                          Download Bill
                        </a>
                      ) : (
                        <span className="sub-text">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}

                {studentOrders.length === 0 && (
                  <tr>
                    <td colSpan="7">No orders found. Add items to cart and place your first order.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </>
  );
}
