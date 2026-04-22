import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    stallId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    stallName: {
      type: String,
      required: true,
      trim: true,
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ stallId: 1, studentEmail: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
