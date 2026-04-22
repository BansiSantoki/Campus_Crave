import process from "node:process";
import Register from "../models/Register.js";

export async function ensureAdminAccount() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@campus.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const targetAccount = await Register.findOne({ email: adminEmail });

  if (targetAccount) {
    targetAccount.role = "admin";
    targetAccount.password = adminPassword;
    targetAccount.confirmPassword = adminPassword;
    targetAccount.updatedAt = new Date();
    await targetAccount.save();

    await Register.deleteMany({
      role: "admin",
      email: { $ne: adminEmail },
    });

    console.log(`Promoted existing account to admin for ${adminEmail}`);
    return;
  }

  const existingAdmin = await Register.findOne({ role: "admin" });

  if (existingAdmin) {
    existingAdmin.email = adminEmail;
    existingAdmin.password = adminPassword;
    existingAdmin.confirmPassword = adminPassword;
    existingAdmin.updatedAt = new Date();
    await existingAdmin.save();

    await Register.deleteMany({
      role: "admin",
      email: { $ne: adminEmail },
    });

    console.log(`Updated admin account to ${adminEmail}`);
    return;
  }

  const adminUser = new Register({
    studentId: "ADM001",
    firstName: "Admin",
    lastName: "User",
    fullname: "Admin User",
    email: adminEmail,
    phone: "9999999999",
    mobile: "9999999999",
    department: "Administration",
    year: "Staff",
    password: adminPassword,
    confirmPassword: adminPassword,
    terms: true,
    role: "admin",
    profile_picture: "",
    gender: "Not Specified",
    address: "Campus Administration",
  });

  await adminUser.save();
  console.log(`Created default admin account for ${adminEmail}`);
}
