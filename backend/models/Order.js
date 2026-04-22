import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentEmail: {
    type: String,
    required: true,
  },
  studentPhone: {
    type: String,
    required: false,
  },
  stallId: {
    type: String,
    required: true,
  },
  stallName: {
    type: String,
    required: true,
  },
  stallOwner: {
    type: String,
    required: true,
  },
  items: [
    {
      itemId: String,
      itemName: String,
      quantity: Number,
      price: Number,
      totalPrice: Number,
    },
  ],
  totalItems: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  pickupTime: {
    type: String,
    required: true,
  },
  specialInstructions: {
    type: String,
    default: "",
  },
  paymentMethod: {
    type: String,
    enum: ["online", "cash", "wallet"],
    required: true,
  },
  orderStatus: {
    type: String,
    enum: ["New", "Accepted", "Preparing", "Ready", "Completed", "Cancelled"],
    default: "New",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  billPdfUrl: {
    type: String,
    default: "",
  },
  billPdfFileName: {
    type: String,
    default: "",
  },
  whatsappSent: {
    type: Boolean,
    default: false,
  },
  whatsappSentAt: {
    type: Date,
    required: false,
  },
  whatsappError: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Order", orderSchema);
