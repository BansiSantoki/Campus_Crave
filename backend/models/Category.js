import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: String,
      default: "system",
      trim: true,
    },
  },
  { timestamps: true }
);

categorySchema.pre("save", function normalizeName(next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  next();
});

export default mongoose.model("Category", categorySchema);