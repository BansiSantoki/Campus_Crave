import express from "express";
import {
  createOrder,
  createRazorpayPaymentOrder,
  getAllOrders,
  getOrdersByStudent,
  getOrdersByStall,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  sendOrderBillEmail,
  sendOrderBillWhatsApp,
  downloadOrderBillPdf,
  verifyRazorpayPayment,
  submitOrderReview,
} from "../controllers/Order.controller.js";

const router = express.Router();

// Create new order
router.post("/orders", createOrder);

// Razorpay payment order (for online orders)
router.post("/payments/razorpay/create-order", createRazorpayPaymentOrder);

// Razorpay payment verification
router.post("/payments/razorpay/verify", verifyRazorpayPayment);

// Get all orders
router.get("/orders", getAllOrders);

// Get orders by student email
router.get("/orders/student/:email", getOrdersByStudent);

// Get orders by stall ID
router.get("/orders/stall/:stallId", getOrdersByStall);

// Get single order by ID
router.get("/orders/:orderId", getOrderById);

// Download order bill PDF
router.get("/orders/:orderId/bill", downloadOrderBillPdf);

// Update order status
router.put("/orders/:orderId", updateOrderStatus);

// Cancel order
router.delete("/orders/:orderId", cancelOrder);

// Send bill email
router.post("/orders/:orderId/send-bill", sendOrderBillEmail);

// Send bill to admin WhatsApp number
router.post("/orders/:orderId/send-whatsapp", sendOrderBillWhatsApp);

// Submit student rating and review for an order
router.post("/orders/:orderId/review", submitOrderReview);

export default router;
