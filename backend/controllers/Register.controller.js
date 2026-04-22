import Register from "../models/Register.js";
import Stall from "../models/Stall.js";
import MenuItem from "../models/MenuItem.js";
import { recordActivity } from "../services/activityLogger.js";
import {
  sendLoginNotificationEmail,
  sendPasswordResetOtpEmail,
  sendVerificationEmail,
} from "../config/mailer.js";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";


export const getRegistrations = async (req, res) => {
  try {
    const users = await Register.find()
      .select(
        "studentId firstName lastName fullname email phone department year role profile_picture createdAt",
      )
      .sort({ createdAt: -1 });


    res.status(200).json({ data: users });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching registrations" });
  }
};


export const updateRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array(), message: "Validation failed" });
  }
  try {
    const { id } = req.params;
    const {
      studentId,
      firstName,
      lastName,
      email,
      phone,
      department,
      year,
      role,
      stallName,
    } = req.body;


    const existingUser = await Register.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "Registration not found" });
    }


    const normalizedEmail = email ? String(email).trim().toLowerCase() : existingUser.email;

    if (normalizedEmail && normalizedEmail !== String(existingUser.email || "").toLowerCase()) {
      const duplicateEmail = await Register.findOne({ email: normalizedEmail });
      if (duplicateEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    if (studentId && studentId !== existingUser.studentId) {
      const duplicateStudentId = await Register.findOne({ studentId });
      if (duplicateStudentId) {
        return res.status(400).json({ message: "Student ID already registered" });
      }
    }


    const updateData = {
      studentId,
      firstName,
      lastName,
      fullname: `${firstName || existingUser.firstName || ""} ${lastName || existingUser.lastName || ""}`.trim(),
      email: normalizedEmail,
      phone,
      mobile: phone,
      department,
      year,
      role,
      stallName: stallName || "",
      updatedAt: new Date(),
    };


    if (req.file) {
      updateData.profile_picture = req.file.filename;
    }


    const updatedUser = await Register.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).select(
      "studentId firstName lastName fullname email phone department year role stallName profile_picture createdAt",
    );

    const effectiveRole = role || existingUser.role;
    if (effectiveRole === "stall") {
      await Stall.findOneAndUpdate(
        { ownerEmail: String(normalizedEmail || existingUser.email || "").toLowerCase() },
        {
          stallName:
            stallName ||
            existingUser.stallName ||
            `${(firstName || existingUser.firstName || "").trim()} Stall`,
          owner: `${firstName || existingUser.firstName || ""} ${lastName || existingUser.lastName || ""}`.trim() || "Stall Owner",
          ownerEmail: String(normalizedEmail || existingUser.email || "").toLowerCase(),
          contact: phone || existingUser.phone || "",
          cuisine: department || existingUser.department || "General",
          status: "Active",
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
    }

    await recordActivity({
      actorName: updatedUser.fullname,
      actorEmail: normalizedEmail,
      actorRole: effectiveRole,
      action: "registration_updated",
      entityType: "registration",
      entityId: String(updatedUser._id),
      entityName: updatedUser.fullname,
      details: `${effectiveRole === "stall" ? "Stall owner" : "Student"} profile updated`,
      metadata: { role: effectiveRole },
    });


    return res.status(200).json({
      message: "Registration updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return res
      .status(500)
      .json({ message: "Server error while updating registration" });
  }
};


export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await Register.findByIdAndDelete(id);


    if (!deletedUser) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (deletedUser.role === "stall") {
      const stall = await Stall.findOneAndDelete({ ownerEmail: String(deletedUser.email || "").toLowerCase() });
      if (stall) {
        await MenuItem.deleteMany({ stallId: String(stall._id) });
      }
    }

    await recordActivity({
      actorName: deletedUser.fullname,
      actorEmail: deletedUser.email,
      actorRole: deletedUser.role,
      action: "registration_deleted",
      entityType: "registration",
      entityId: String(deletedUser._id),
      entityName: deletedUser.fullname,
      details: `${deletedUser.role === "stall" ? "Stall owner" : "Student"} profile deleted`,
      metadata: { role: deletedUser.role },
    });


    return res
      .status(200)
      .json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return res
      .status(500)
      .json({ message: "Server error while deleting registration" });
  }
};


export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array(), msg: "Validation failed" });
  }


  try {
    const {
      studentId,
      firstName,
      lastName,
      email,
      phone,
      department,
      year,
      stallName,
      password,
      confirmPassword,
      role,
    } = req.body;


    const normalizedEmail = String(email || "").trim().toLowerCase();
    const profile_picture = req.file ? req.file.filename : null;
    const existingUser = await Register.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingStudentId = await Register.findOne({ studentId });
    if (existingStudentId) {
      return res.status(400).json({ message: "Student ID already registered" });
    }

    const newUser = new Register({
      studentId,
      firstName,
      lastName,
      fullname: `${firstName} ${lastName}`.trim(),
      email: normalizedEmail,
      phone,
      mobile: phone,
      department,
      year,
      password,
      confirmPassword,
      terms: true,
      role: role || "student",
      profile_picture,
      gender: "Not Specified",
      address: `${department} - ${year}`,
      stallName: role === "stall" ? stallName || `${firstName} Stall` : "",
    });


    await newUser.save();

    const toBool = (value, fallback = true) => {
      const normalized = String(value ?? "").trim().toLowerCase();
      if (!normalized) return fallback;
      return ["1", "true", "yes", "on"].includes(normalized);
    };
    const enforceRegistrationEmail = toBool(process.env.ENFORCE_REGISTRATION_EMAIL, true);

    const verificationResult = await sendVerificationEmail({
      ...newUser.toObject(),
      email: normalizedEmail,
    });

    if (!verificationResult.success && enforceRegistrationEmail) {
      await Register.findByIdAndDelete(newUser._id);
      return res.status(503).json({
        message:
          verificationResult.message ||
          "Registration failed because verification email could not be sent.",
        verificationEmailSent: false,
      });
    }

    await Register.findByIdAndUpdate(newUser._id, {
      emailVerificationSentAt: verificationResult.success ? new Date() : null,
      updatedAt: new Date(),
    });

    if ((role || "student") === "stall") {
      await Stall.findOneAndUpdate(
        { ownerEmail: normalizedEmail },
        {
          stallName: stallName || `${firstName} Stall`,
          owner: `${firstName} ${lastName}`.trim(),
          ownerEmail: normalizedEmail,
          contact: phone,
          cuisine: department,
          status: "Active",
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
    }

    await recordActivity({
      actorName: newUser.fullname,
      actorEmail: normalizedEmail,
      actorRole: newUser.role,
      action: "registered",
      entityType: "registration",
      entityId: String(newUser._id),
      entityName: newUser.fullname,
      details: `${newUser.role === "stall" ? "Stall owner" : "Student"} registered successfully`,
      metadata: {
        role: newUser.role,
        verificationEmailSent: Boolean(verificationResult.success),
        verificationEmailMessage: verificationResult.message || "",
      },
    });
    // In a real application, you would hash the password before saving and not return the user object directly


    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        studentId: newUser.studentId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        fullname: newUser.fullname,
        email: newUser.email,
        phone: newUser.phone,
        department: newUser.department,
        year: newUser.year,
        role: newUser.role,
        stallName: newUser.stallName,
      },
      verificationEmailSent: Boolean(verificationResult.success),
      verificationEmailMessage: verificationResult.message || "",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyValue || {})[0];
      const duplicateValue = duplicateField ? error.keyValue[duplicateField] : "value";
      return res.status(400).json({
        message: `${duplicateField || "Field"} already registered`,
        field: duplicateField || null,
        value: duplicateValue,
      });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
};


export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array(), message: "Validation failed" });
  }


  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user = await Register.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }


    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.lastLoginAt = new Date();
    user.loginCount = Number(user.loginCount || 0) + 1;
    await user.save();

    await recordActivity({
      actorName: user.fullname,
      actorEmail: user.email,
      actorRole: user.role,
      action: "logged_in",
      entityType: "authentication",
      entityId: String(user._id),
      entityName: user.fullname,
      details: `${user.role === "stall" ? "Stall owner" : "Student"} logged in`,
      metadata: { loginCount: user.loginCount },
    });

    let loginEmailNotificationSent = false;
    if (["student", "stall"].includes(String(user.role || "").toLowerCase())) {
      try {
        const mailResult = await sendLoginNotificationEmail(user.toObject ? user.toObject() : user);
        loginEmailNotificationSent = Boolean(mailResult?.success);
      } catch (mailError) {
        console.error("Error sending login notification:", mailError?.message || mailError);
      }
    }


    res.status(200).json({
      message: "Login successful",
      loginEmailNotificationSent,
      user: {
        id: user._id,
        studentId: user.studentId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        department: user.department,
        year: user.year,
        role: user.role,
        stallName: user.stallName || "",
        profile_picture: user.profile_picture,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array(), message: "Validation failed" });
  }

  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user = await Register.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from current password" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Confirm password does not match" });
    }

    // Assign plain password; model pre-save hook hashes it once.
    user.password = newPassword;
    user.confirmPassword = confirmPassword;
    user.updatedAt = new Date();

    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error during change password:", error);
    return res.status(500).json({ message: "Server error during password update" });
  }
};

export const requestForgotPasswordOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array(), message: "Validation failed" });
  }

  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user = await Register.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    if (
      user.passwordResetSentAt &&
      now.getTime() - new Date(user.passwordResetSentAt).getTime() < 60 * 1000
    ) {
      return res.status(429).json({ message: "Please wait 1 minute before requesting a new OTP" });
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const allowDevOtpFallback = false;

    const mailResult = await sendPasswordResetOtpEmail(
      user.toObject ? user.toObject() : user,
      otp,
    );

    if (!mailResult?.success) {
      if (!allowDevOtpFallback) {
        return res.status(500).json({
          message:
            mailResult?.message ||
            "OTP email could not be sent right now. Please contact admin or try again later.",
          error: mailResult?.error || null,
        });
      }

      console.warn(
        "Forgot-password email failed; using development OTP fallback.",
        mailResult?.error || mailResult?.message || "Unknown mail error",
      );
    }

    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    user.passwordResetSentAt = now;
    user.updatedAt = now;
    await user.save();

    if (!mailResult?.success && allowDevOtpFallback) {
      return res.status(200).json({
        message: "SMTP issue detected. Development OTP generated successfully.",
        otpEmailSent: false,
        developmentMode: true,
        devOtp: otp,
      });
    }

    return res.status(200).json({
      message: "Password reset OTP sent to your email",
      otpEmailSent: true,
    });
  } catch (error) {
    console.error("Error requesting forgot password OTP:", error);
    return res.status(500).json({
      message: error?.message || "Server error while sending OTP",
    });
  }
};

export const resetForgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array(), message: "Validation failed" });
  }

  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedOtp = String(otp || "").trim();

    const user = await Register.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ message: "OTP not requested. Please request OTP first" });
    }

    if (new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired. Please request a new OTP" });
    }

    if (user.passwordResetOtp !== normalizedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Confirm password does not match" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from current password" });
    }

    // Assign plain password; model pre-save hook hashes it once.
    user.password = newPassword;
    user.confirmPassword = confirmPassword;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpiresAt = null;
    user.updatedAt = new Date();

    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting forgot password:", error);
    return res.status(500).json({ message: "Server error while resetting password" });
  }
};
