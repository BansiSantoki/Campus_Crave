import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import PDFDocument from "pdfkit";
import Razorpay from "razorpay";
import { fileURLToPath } from "url";
import Order from "../models/Order.js";
import { isPublicBillUrl, sendWhatsAppBill } from "../services/whatsappService.js";
import { getBillDownloadUrl, sendEmail } from "../config/mailer.js";
import { recordActivity } from "../services/activityLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../uploads");
const billsDir = path.join(uploadsRoot, "bills");

const REQUIRED_FIELDS = [
  "studentId",
  "studentName",
  "studentEmail",
  "stallId",
  "stallName",
  "stallOwner",
  "items",
  "totalItems",
  "subtotal",
  "tax",
  "totalAmount",
  "pickupTime",
  "paymentMethod",
];

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const createOrderId = () => `ORD${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
const isOnlinePayment = (paymentMethod) => String(paymentMethod || "").toLowerCase() === "online";

const getRazorpayClient = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  console.log("🔍 DEBUG Razorpay Config:", {
    keyId: keyId ? `${keyId.substring(0, 10)}...` : "MISSING",
    keySecret: keySecret ? `${keySecret.substring(0, 10)}...` : "MISSING",
  });

  if (!keyId || !keySecret) {
    console.error("❌ Razorpay keys missing! keyId:", !!keyId, "keySecret:", !!keySecret);
    return null;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getMissingFields = (payload) =>
  REQUIRED_FIELDS.filter((field) => {
    if (field === "items") {
      return !Array.isArray(payload.items) || payload.items.length === 0;
    }
    return payload[field] === undefined || payload[field] === null || payload[field] === "";
  });

const buildOrderBillHtml = (order) => {
  const itemsRows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${item.itemName}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatMoney(item.price)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatMoney(item.totalPrice)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#222;">
      <h2 style="margin-bottom:8px;">Campus Crave - Order Bill</h2>
      <p style="margin-top:0;color:#666;">Order ID: <strong>${order.orderId}</strong></p>
      <p><strong>Student:</strong> ${order.studentName} (${order.studentEmail})</p>
      <p><strong>Stall:</strong> ${order.stallName}</p>
      <p><strong>Pickup Time:</strong> ${order.pickupTime}</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center;">Qty</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Price</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <p><strong>Subtotal:</strong> ${formatMoney(order.subtotal)}</p>
      <p><strong>Tax (5%):</strong> ${formatMoney(order.tax)}</p>
      <p style="font-size:18px;"><strong>Grand Total:</strong> ${formatMoney(order.totalAmount)}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      ${
        order.specialInstructions
          ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>`
          : ""
      }
      <p style="margin-top:24px;color:#666;">Thank you for ordering from Campus Crave.</p>
    </div>
  `;
};

const createBillPdfFile = async (order) => {
  await fs.promises.mkdir(billsDir, { recursive: true });

  const fileName = `${order.orderId}.pdf`;
  const filePath = path.join(billsDir, fileName);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = fs.createWriteStream(filePath);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const left = 42;
    const right = pageWidth - 42;

    // Background accents
    doc.rect(0, 0, pageWidth, pageHeight).fill("#f7fcf9");
    doc.circle(pageWidth - 32, 38, 72).fill("#d9f5e7");
    doc.circle(26, pageHeight - 36, 62).fill("#e9fbf3");

    // Header band
    doc.roundedRect(left, 24, right - left, 96, 12).fill("#0f8f57");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(27).text("Campus Crave", left + 20, 48);
    doc.font("Helvetica").fontSize(12).text("ORDER INVOICE", left + 22, 80);
    doc.roundedRect(right - 180, 58, 150, 30, 8).fill("#22b573");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text(`Invoice: ${order.orderId}`, right - 168, 68);

    // Meta cards
    doc.roundedRect(left, 138, 250, 74, 10).fill("#ffffff").strokeColor("#cae8d8").lineWidth(1).stroke();
    doc.fillColor("#4c6d5b").font("Helvetica").fontSize(10).text("Billed To", left + 12, 150);
    doc.fillColor("#153f2a").font("Helvetica-Bold").fontSize(12).text(order.studentName || "Student", left + 12, 165);
    doc.fillColor("#2f5b44").font("Helvetica").fontSize(10.5).text(order.studentEmail || "-", left + 12, 182);

    doc.roundedRect(312, 138, right - 312, 74, 10).fill("#ffffff").strokeColor("#cae8d8").lineWidth(1).stroke();
    doc.fillColor("#4c6d5b").font("Helvetica").fontSize(10).text("Order Info", 324, 150);
    doc.fillColor("#153f2a").font("Helvetica-Bold").fontSize(11).text(`Stall: ${order.stallName || "Campus Stall"}`, 324, 165);
    doc.fillColor("#2f5b44").font("Helvetica").fontSize(10.5).text(`Pickup: ${order.pickupTime || "-"}`, 324, 182);

    // Items table
    const tableTop = 236;
    const rowHeight = 27;
    const c1 = left;
    const c2 = 335;
    const c3 = 400;
    const c4 = 482;

    doc.roundedRect(left, tableTop, right - left, rowHeight, 7).fill("#daf4e6");
    doc.fillColor("#0d7f4b").font("Helvetica-Bold").fontSize(10.5);
    doc.text("Item", c1 + 10, tableTop + 8);
    doc.text("Qty", c2 + 8, tableTop + 8);
    doc.text("Rate", c3 + 8, tableTop + 8);
    doc.text("Amount", c4 + 8, tableTop + 8);

    let y = tableTop + rowHeight;
    (order.items || []).forEach((item, index) => {
      if (index % 2 === 0) {
        doc.rect(left, y, right - left, rowHeight).fill("#ffffff");
      } else {
        doc.rect(left, y, right - left, rowHeight).fill("#f3fbf6");
      }

      doc.fillColor("#1a1a1a").font("Helvetica").fontSize(10.5);
      doc.text(String(item.itemName || "Item"), c1 + 10, y + 8, { width: c2 - c1 - 16, ellipsis: true });
      doc.text(String(item.quantity || 0), c2 + 8, y + 8);
      doc.text(formatMoney(item.price), c3 + 8, y + 8);
      doc.text(formatMoney(item.totalPrice), c4 + 8, y + 8);
      y += rowHeight;
    });

    doc.rect(left, tableTop, right - left, Math.max(rowHeight * ((order.items || []).length + 1), rowHeight * 2))
      .lineWidth(1)
      .strokeColor("#cae8d8")
      .stroke();

    // Summary block
    const summaryTop = y + 18;
    doc.roundedRect(328, summaryTop, right - 328, 118, 12).fill("#e9f9f0");
    doc.fillColor("#1f5d3f").font("Helvetica").fontSize(11);
    doc.text("Subtotal", 342, summaryTop + 18);
    doc.text(formatMoney(order.subtotal), 460, summaryTop + 18, { width: 110, align: "right" });
    doc.text("Tax (5%)", 342, summaryTop + 44);
    doc.text(formatMoney(order.tax), 460, summaryTop + 44, { width: 110, align: "right" });
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#0b8a50");
    doc.text("Grand Total", 342, summaryTop + 74);
    doc.text(formatMoney(order.totalAmount), 442, summaryTop + 74, { width: 128, align: "right" });

    // Notes
    doc.fillColor("#304f40").font("Helvetica").fontSize(10.5);
    doc.text(`Payment: ${String(order.paymentMethod || "online").toUpperCase()}`, left, summaryTop + 16);
    if (order.specialInstructions) {
      doc.text(`Instructions: ${order.specialInstructions}`, left, summaryTop + 40, { width: 270 });
    }

    // Footer
    doc.moveTo(left, pageHeight - 78).lineTo(right, pageHeight - 78).strokeColor("#b8ddc8").lineWidth(1).stroke();
    doc.fillColor("#2d6548").font("Helvetica-Bold").fontSize(10.5).text("Thank you for ordering with Campus Crave", left, pageHeight - 64, {
      align: "center",
      width: right - left,
    });
    doc.fillColor("#4e7c64").font("Helvetica").fontSize(9.5).text("Invoice Template v3 • support@campuscrave.local", left, pageHeight - 48, {
      align: "center",
      width: right - left,
    });
    doc.end();
  });

  return {
    fileName,
    filePath,
    publicUrl: getBillDownloadUrl(order.orderId),
  };
};

const finalizeOrderArtifacts = async (order) => {
  let billPdf = null;
  try {
    billPdf = await createBillPdfFile(order);
    order.billPdfFileName = billPdf.fileName;
    order.billPdfUrl = billPdf.publicUrl;
    order.updatedAt = new Date();
  } catch (pdfError) {
    console.error("PDF generation failed:", pdfError.message);
  }

  const whatsappTarget = String(order.studentPhone || "").trim();
  const billLink = billPdf?.publicUrl || order.billPdfUrl || "";
  const billUrlPublic = isPublicBillUrl(billLink);

  let whatsappResult = {
    success: false,
    message: "Phone number unavailable. WhatsApp bill not sent.",
  };

  if (whatsappTarget) {
    whatsappResult = await sendWhatsAppBill(whatsappTarget, order, {
      mediaUrl: billPdf?.publicUrl,
      billLink,
    });

    order.whatsappSent = Boolean(whatsappResult.success);
    order.whatsappSentAt = whatsappResult.success ? new Date() : null;
    order.whatsappError = whatsappResult.success
      ? ""
      : whatsappResult.message || whatsappResult.error || "Failed to send WhatsApp bill";
  }

  await order.save();

  return {
    billPdf,
    billUrlPublic,
    whatsappTarget,
    whatsappResult,
  };
};

export const createOrder = async (req, res) => {
  try {
    const payload = req.body || {};
    const missingFields = getMissingFields(payload);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const requestedPaymentStatus = payload.paymentStatus || "Pending";
    const sanitizedPaymentStatus = isOnlinePayment(payload.paymentMethod)
      ? "Pending"
      : requestedPaymentStatus;

    const order = new Order({
      ...payload,
      orderId: payload.orderId || createOrderId(),
      orderStatus: payload.orderStatus || "New",
      paymentStatus: sanitizedPaymentStatus,
      paymentReference: isOnlinePayment(payload.paymentMethod)
        ? ""
        : String(payload.paymentReference || "").trim(),
      updatedAt: new Date(),
    });

    const savedOrder = await order.save();

    await recordActivity({
      actorName: savedOrder.studentName,
      actorEmail: savedOrder.studentEmail,
      actorRole: "student",
      action: "order_created",
      entityType: "order",
      entityId: String(savedOrder._id),
      entityName: savedOrder.orderId,
      details: `Order ${savedOrder.orderId} was placed`,
      metadata: {
        stallId: savedOrder.stallId,
        stallName: savedOrder.stallName,
        totalAmount: savedOrder.totalAmount,
        billPdfUrl: savedOrder.billPdfUrl || null,
      },
    });

    if (isOnlinePayment(savedOrder.paymentMethod)) {
      return res.status(201).json({
        success: true,
        message: "Order created. Complete payment to confirm order.",
        orderId: savedOrder.orderId,
        order: savedOrder,
        requiresPayment: true,
        billPdfUrl: null,
        whatsappSent: false,
        whatsappTarget: String(savedOrder.studentPhone || "").trim() || null,
        whatsappMessage: "Payment pending. Bill will be shared after payment verification.",
        whatsappError: "",
        billUrlPublic: false,
      });
    }

    const finalization = await finalizeOrderArtifacts(savedOrder);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder.orderId,
      order: savedOrder,
      whatsappSent: Boolean(finalization.whatsappResult.success),
      whatsappTarget: finalization.whatsappTarget || null,
      whatsappMessage: finalization.whatsappResult.message || "",
      whatsappError: finalization.whatsappResult.success
        ? ""
        : finalization.whatsappResult.error || finalization.whatsappResult.message || "",
      billPdfUrl: finalization.billPdf?.publicUrl || savedOrder.billPdfUrl || null,
      billUrlPublic: finalization.billUrlPublic,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

export const createRazorpayPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const order = await Order.findOne({ orderId: String(orderId).trim() });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!isOnlinePayment(order.paymentMethod)) {
      return res.status(400).json({ success: false, message: "Razorpay is only available for online payments" });
    }

    if (order.paymentStatus === "Completed") {
      return res.status(400).json({ success: false, message: "Payment is already completed for this order" });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(400).json({
        success: false,
        message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
      });
    }

    const amountInPaise = Math.round(Number(order.totalAmount || 0) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount" });
    }

    const currency = String(process.env.RAZORPAY_CURRENCY || "INR").toUpperCase();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: String(order.orderId).slice(0, 40),
      notes: {
        campusOrderId: order.orderId,
        studentEmail: order.studentEmail || "",
      },
    });

    order.paymentGateway = "razorpay";
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "Pending";
    order.updatedAt = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Razorpay order created",
      keyId: String(process.env.RAZORPAY_KEY_ID || "").trim(),
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency,
      campusOrderId: order.orderId,
      customer: {
        name: order.studentName,
        email: order.studentEmail,
        contact: order.studentPhone || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay payment order",
      error: error.message,
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body || {};

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required",
      });
    }

    const order = await Order.findOne({ orderId: String(orderId).trim() });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!isOnlinePayment(order.paymentMethod)) {
      return res.status(400).json({ success: false, message: "Razorpay verification is only valid for online orders" });
    }

    if (order.paymentStatus === "Completed") {
      return res.status(200).json({
        success: true,
        message: "Payment is already verified for this order",
        order,
      });
    }

    if (!order.razorpayOrderId || String(order.razorpayOrderId) !== String(razorpayOrderId)) {
      order.paymentStatus = "Failed";
      order.updatedAt = new Date();
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match the Campus Crave order",
      });
    }

    const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!keySecret) {
      return res.status(400).json({
        success: false,
        message: "Razorpay is not configured. Missing RAZORPAY_KEY_SECRET",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      order.paymentStatus = "Failed";
      order.updatedAt = new Date();
      await order.save();

      return res.status(400).json({ success: false, message: "Invalid Razorpay payment signature" });
    }

    order.paymentGateway = "razorpay";
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentReference = razorpayPaymentId;
    order.paymentStatus = "Completed";
    order.updatedAt = new Date();
    await order.save();

    const finalization = await finalizeOrderArtifacts(order);

    await recordActivity({
      actorName: order.studentName,
      actorEmail: order.studentEmail,
      actorRole: "student",
      action: "payment_verified",
      entityType: "order",
      entityId: String(order._id),
      entityName: order.orderId,
      details: `Payment verified for ${order.orderId}`,
      metadata: {
        paymentReference: razorpayPaymentId,
        paymentGateway: "razorpay",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
      billPdfUrl: finalization.billPdf?.publicUrl || order.billPdfUrl || null,
      whatsappSent: Boolean(finalization.whatsappResult.success),
      whatsappTarget: finalization.whatsappTarget || null,
      whatsappMessage: finalization.whatsappResult.message || "",
      whatsappError: finalization.whatsappResult.success
        ? ""
        : finalization.whatsappResult.error || finalization.whatsappResult.message || "",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

export const getAllOrders = async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrdersByStudent = async (req, res) => {
  try {
    const email = req.params.email;
    const orders = await Order.find({ studentEmail: email }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrdersByStall = async (req, res) => {
  try {
    const stallId = req.params.stallId;
    const orders = await Order.find({ stallId }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, status } = req.body || {};
    const updatePayload = { updatedAt: new Date() };
    const nextOrderStatus = orderStatus || status;

    if (nextOrderStatus) {
      updatePayload.orderStatus = nextOrderStatus === "Prepared" ? "Preparing" : nextOrderStatus;
    }
    if (paymentStatus) updatePayload.paymentStatus = paymentStatus;

    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      updatePayload,
      { returnDocument: "after", runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await recordActivity({
      actorName: order.stallOwner,
      actorRole: "stall",
      action: "order_status_updated",
      entityType: "order",
      entityId: String(order._id),
      entityName: order.orderId,
      details: `Order ${order.orderId} status changed to ${order.orderStatus}`,
      metadata: { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus },
    });

    return res.json({ success: true, order, message: "Order updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { orderStatus: "Cancelled", updatedAt: new Date() },
      { returnDocument: "after", runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await recordActivity({
      actorName: order.stallOwner,
      actorRole: "stall",
      action: "order_cancelled",
      entityType: "order",
      entityId: String(order._id),
      entityName: order.orderId,
      details: `Order ${order.orderId} was cancelled`,
      metadata: { orderStatus: order.orderStatus },
    });

    return res.json({ success: true, order, message: "Order cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendOrderBillEmail = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const mailResult = await sendEmail({
      to: order.studentEmail,
      subject: `Campus Crave Bill - ${order.orderId}`,
      html: buildOrderBillHtml(order),
    });

    if (!mailResult?.success) {
      return res.status(500).json({
        success: false,
        message: mailResult?.message || "Failed to send bill email",
      });
    }

    await recordActivity({
      actorName: order.stallOwner,
      actorRole: "stall",
      action: "order_bill_emailed",
      entityType: "order",
      entityId: String(order._id),
      entityName: order.orderId,
      details: `Bill email sent to ${order.studentEmail}`,
      metadata: { orderId: order.orderId },
    });

    return res.json({
      success: true,
      message: `Bill sent to ${order.studentEmail}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send bill email",
      error: error.message,
    });
  }
};

export const sendOrderBillWhatsApp = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const target = String(req.body?.phoneNumber || order.studentPhone || "").trim();
    if (!target) {
      return res.status(400).json({
        success: false,
        message: "Phone number not available for WhatsApp bill",
      });
    }

    let billPdf = null;
    try {
      billPdf = await createBillPdfFile(order);
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError.message);
    }

    const billLink = billPdf?.publicUrl || order.billPdfUrl || "";
    const billUrlPublic = isPublicBillUrl(billLink);

    const result = await sendWhatsAppBill(target, order, {
      mediaUrl: billPdf?.publicUrl,
      billLink,
    });

    order.whatsappSent = Boolean(result.success);
    order.whatsappSentAt = result.success ? new Date() : null;
    order.whatsappError = result.success
      ? ""
      : result.message || result.error || "Failed to send WhatsApp bill";
    await order.save();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to send WhatsApp bill",
      });
    }

    await recordActivity({
      actorName: order.stallOwner,
      actorRole: "stall",
      action: "order_bill_whatsapp_sent",
      entityType: "order",
      entityId: String(order._id),
      entityName: order.orderId,
      details: `Bill WhatsApp sent to ${target}`,
      metadata: { whatsappTarget: target, orderId: order.orderId },
    });

    return res.json({
      success: true,
      message: "WhatsApp bill sent successfully",
      whatsappTarget: target,
      messageId: result.messageId,
      billPdfUrl: billPdf?.publicUrl || order.billPdfUrl || null,
      billUrlPublic,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send WhatsApp bill",
      error: error.message,
    });
  }
};

export const downloadOrderBillPdf = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Always regenerate so users always get latest bill UI template.
    const regenerated = await createBillPdfFile(order);
    order.billPdfFileName = regenerated.fileName;
    order.billPdfUrl = regenerated.publicUrl;
    await order.save();
    return res.download(regenerated.filePath, `${order.orderId}.pdf`);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to download bill PDF", error: error.message });
  }
};

export const submitOrderReview = async (req, res) => {
  try {
    const { rating, review } = req.body || {};
    const numericRating = Number(rating);
    const sanitizedReview = String(review || "").trim();

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    if (sanitizedReview.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Review must be 500 characters or less",
      });
    }

    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["Completed", "Ready"].includes(String(order.orderStatus || ""))) {
      return res.status(400).json({
        success: false,
        message: "Review can be submitted only after order is ready or completed",
      });
    }

    order.studentRating = numericRating;
    order.studentReview = sanitizedReview;
    order.studentReviewedAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    await recordActivity({
      actorName: order.studentName,
      actorEmail: order.studentEmail,
      actorRole: "student",
      action: "order_review_submitted",
      entityType: "order",
      entityId: String(order._id),
      entityName: order.orderId,
      details: `Review submitted for ${order.orderId}`,
      metadata: {
        rating: numericRating,
        hasReviewText: Boolean(sanitizedReview),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Rating and review submitted successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit order review",
      error: error.message,
    });
  }
};