import mongoose from "mongoose";

const stallSchema = new mongoose.Schema(
  {
    stallName: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    cuisine: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    rating: {
      type: Number,
      default: 4.2,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    ordersCount: {
      type: Number,
      default: 0,
    },
    hours: {
      type: String,
      default: "9:00 AM - 6:00 PM",
    },
    specialties: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "Popular campus food stall serving fresh meals.",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Stall", stallSchema);
