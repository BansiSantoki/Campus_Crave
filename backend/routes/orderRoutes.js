import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrdersByStudent,
  getOrdersByStall,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  sendOrderBillEmail,
  sendOrderBillWhatsApp,
  downloadOrderBillPdf,
} from "../controllers/Order.controller.js";

const router = express.Router();

// Create new order
router.post("/orders", createOrder);

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

export default router;
