import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import Order from "../models/Order.js";
import { sendWhatsAppBill } from "../services/whatsappService.js";
import { getBillDownloadUrl, getMailerConfig, sendEmail } from "../config/mailer.js";
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

    doc.fontSize(20).text("Campus Crave - Order Bill", { align: "center" });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Order ID: ${order.orderId}`);
    doc.text(`Student: ${order.studentName} (${order.studentEmail})`);
    doc.text(`Stall: ${order.stallName}`);
    doc.text(`Pickup Time: ${order.pickupTime}`);
    doc.moveDown();

    doc.fontSize(14).text("Items:", { underline: true });
    doc.moveDown(0.5);
    (order.items || []).forEach((item) => {
      doc
        .fontSize(12)
        .text(
          `${item.itemName} | Qty: ${item.quantity} | Price: ${formatMoney(item.price)} | Total: ${formatMoney(item.totalPrice)}`
        );
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ${formatMoney(order.subtotal)}`);
    doc.text(`Tax (5%): ${formatMoney(order.tax)}`);
    doc.fontSize(13).text(`Grand Total: ${formatMoney(order.totalAmount)}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);

    if (order.specialInstructions) {
      doc.moveDown();
      doc.fontSize(12).text(`Special Instructions: ${order.specialInstructions}`);
    }

    doc.moveDown(1.5);
    doc.fontSize(11).text("Thank you for ordering from Campus Crave.", { align: "center" });
    doc.end();
  });

  return {
    fileName,
    filePath,
    publicUrl: getBillDownloadUrl(order.orderId),
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

    const order = new Order({
      ...payload,
      orderId: payload.orderId || createOrderId(),
      orderStatus: payload.orderStatus || "New",
      paymentStatus: payload.paymentStatus || "Pending",
      updatedAt: new Date(),
    });

    const savedOrder = await order.save();

    let billPdf = null;
    try {
      billPdf = await createBillPdfFile(savedOrder);
      savedOrder.billPdfFileName = billPdf.fileName;
      savedOrder.billPdfUrl = billPdf.publicUrl;
      savedOrder.updatedAt = new Date();
      await savedOrder.save();
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError.message);
    }

    const whatsappTarget = process.env.ADMIN_WHATSAPP_NUMBER || savedOrder.studentPhone;
    let whatsappResult = {
      success: false,
      message: "Phone number unavailable. WhatsApp bill not sent.",
    };

    if (whatsappTarget) {
      whatsappResult = await sendWhatsAppBill(whatsappTarget, savedOrder, {
        mediaUrl: billPdf?.publicUrl,
      });
      savedOrder.whatsappSent = Boolean(whatsappResult.success);
      savedOrder.whatsappSentAt = whatsappResult.success ? new Date() : null;
      savedOrder.whatsappError = whatsappResult.success
        ? ""
        : whatsappResult.message || whatsappResult.error || "Failed to send WhatsApp bill";
      await savedOrder.save();
    }

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

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder.orderId,
      order: savedOrder,
      whatsappSent: Boolean(whatsappResult.success),
      whatsappTarget: whatsappTarget || null,
      whatsappMessage: whatsappResult.message || "",
      billPdfUrl: billPdf?.publicUrl || savedOrder.billPdfUrl || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
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
      { new: true, runValidators: true }
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
      { new: true, runValidators: true }
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

    const mailerConfig = getMailerConfig();
    if (!mailerConfig) {
      return res.status(400).json({
        success: false,
        message: "Email is not configured. Set EMAIL_USER and EMAIL_PASSWORD in backend/.env",
      });
    }

    await sendEmail({
      to: order.studentEmail,
      subject: `Campus Crave Bill - ${order.orderId}`,
      html: buildOrderBillHtml(order),
    });

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

    const target = req.body?.phoneNumber || process.env.ADMIN_WHATSAPP_NUMBER || order.studentPhone;
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

    const result = await sendWhatsAppBill(target, order, {
      mediaUrl: billPdf?.publicUrl,
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
      billPdfUrl: billPdf?.publicUrl || null,
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

    const fileName = order.billPdfFileName || `${order.orderId}.pdf`;
    const filePath = path.join(billsDir, fileName);

    if (!fs.existsSync(filePath)) {
      const regenerated = await createBillPdfFile(order);
      order.billPdfFileName = regenerated.fileName;
      order.billPdfUrl = regenerated.publicUrl;
      await order.save();
      return res.download(regenerated.filePath, `${order.orderId}.pdf`);
    }

    return res.download(filePath, `${order.orderId}.pdf`);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to download bill PDF", error: error.message });
  }
};