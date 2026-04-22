import { Router } from "express";
import { check } from "express-validator";
import {
  deleteRegistration,
  forgotPassword,
  getRegistrations,
  register,
  updateRegistration,
  login,
} from "../controllers/Register.controller.js";
import { uploadProfilePic } from "../config/multer.js";

const router = Router();


router.get("/register", getRegistrations);
router.put(
  "/register/:id",
  uploadProfilePic.single("profile_picture"),
  [
    check("studentId").notEmpty().withMessage("Student ID is required"),
    check("firstName").notEmpty().withMessage("First name is required"),
    check("lastName").notEmpty().withMessage("Last name is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("phone").notEmpty().withMessage("Phone number is required"),
    check("department").notEmpty().withMessage("Department is required"),
    check("year").notEmpty().withMessage("Year is required"),
  ],
  updateRegistration,
);
router.delete("/register/:id", deleteRegistration);


router.post(
  "/register",
  uploadProfilePic.single("profile_picture"),
  [
    check("studentId").notEmpty().withMessage("Student ID is required"),
    check("firstName").notEmpty().withMessage("First name is required"),
    check("lastName").notEmpty().withMessage("Last name is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("phone").notEmpty().withMessage("Phone number is required"),
    check("department").notEmpty().withMessage("Department is required"),
    check("year").notEmpty().withMessage("Year is required"),
    check("password")
      .isLength({ min: 8, max: 25 })
      .withMessage(
        "Password must be at least 8 characters and at most 25 characters",
      )
      .matches(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,25}/,
      )
      .withMessage(
        "Password must contain at least 8 characters, one uppercase, one lowercase, and one number",
      ),
    check("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      })
      .withMessage("Confirm password must match password"),

    check("role").optional().isIn(["student", "admin", "stall"]),
  ],
  register,
);


router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  login,
); 

router.post(
  "/forgot-password",
  [
    check("email").isEmail().withMessage("Valid email is required"),
    check("currentPassword").notEmpty().withMessage("Current password is required"),
    check("newPassword")
      .isLength({ min: 8, max: 25 })
      .withMessage(
        "Password must be at least 8 characters and at most 25 characters",
      )
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,25}/)
      .withMessage(
        "Password must contain at least 8 characters, one uppercase, one lowercase, and one number",
      ),
  ],
  forgotPassword,
);


export default router;
