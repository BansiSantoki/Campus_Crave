import mongoose from "mongoose";
import bcrypt from "bcrypt";
const registerSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    default: "",
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    default: "Not Specified",
  },
  address: {
    type: String,
    default: "",
  },
  stallName: {
    type: String,
    default: "",
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true,
  },
  terms: {
    type: Boolean,
    default: true,
  },
  profile_picture: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["student", "admin", "stall"],
    default: "student",
  },
  Status: {
    type: String,
    enum: ["Active", "Inactive", "Deleted"],
    default: "Active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  loginCount: {
    type: Number,
    default: 0,
  },
  emailVerificationSentAt: {
    type: Date,
    default: null,
  },
});


registerSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }


  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.confirmPassword = this.password;
});


export default mongoose.model("Register", registerSchema);
