import mongoose from "mongoose";
import Register from "../models/Register.js";
import Stall from "../models/Stall.js";
import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";

async function ensureCollection(name) {
  const existing = await mongoose.connection.db
    .listCollections({ name })
    .toArray();

  if (existing.length === 0) {
    await mongoose.connection.db.createCollection(name);
    console.log(`Created MongoDB collection: ${name}`);
  }
}

export async function ensureStallCollectionsAndData() {
  await ensureCollection("stalls");
  await ensureCollection("menuitems");
  await ensureCollection("categories");

  const defaultStalls = [
    {
      stallName: "Wok Wala",
      owner: "Karan Desai",
      ownerEmail: "wokwala@campuscrave.local",
      contact: "9876501122",
      cuisine: "Chinese",
      status: "Active",
      rating: 4.5,
      ordersCount: 640,
      hours: "10:00 AM - 7:30 PM",
      specialties: ["Noodles", "Fried Rice", "Manchurian"],
      description: "Fast Indo-Chinese meals and combo bowls.",
    },
    {
      stallName: "Chaat Junction",
      owner: "Meera Joshi",
      ownerEmail: "chaatjunction@campuscrave.local",
      contact: "9876501133",
      cuisine: "Street Food",
      status: "Active",
      rating: 4.6,
      ordersCount: 710,
      hours: "11:00 AM - 8:00 PM",
      specialties: ["Pani Puri", "Bhel", "Sev Puri"],
      description: "Fresh and tangy street-food favorites.",
    },
  ];

  const stallOwners = await Register.find({ role: "stall" }).select(
    "firstName lastName fullname email phone department stallName"
  );

  let syncedCount = 0;

  for (const owner of stallOwners) {
    const ownerName =
      owner.fullname || `${owner.firstName || ""} ${owner.lastName || ""}`.trim() || "Stall Owner";

    await Stall.findOneAndUpdate(
      { ownerEmail: String(owner.email || "").toLowerCase() },
      {
        stallName: owner.stallName || `${owner.firstName || "Campus"} Stall`,
        owner: ownerName,
        ownerEmail: String(owner.email || "").toLowerCase(),
        contact: owner.phone || "",
        cuisine: owner.department || "General",
        status: "Active",
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    syncedCount += 1;
  }

  if (syncedCount > 0) {
    console.log(`Synced stalls from existing stall owners: ${syncedCount}`);
  }

  let addedDefaultStalls = 0;
  for (const stall of defaultStalls) {
    const existing = await Stall.findOne({ ownerEmail: stall.ownerEmail });
    if (!existing) {
      await Stall.create(stall);
      addedDefaultStalls += 1;
    }
  }

  if (addedDefaultStalls > 0) {
    console.log(`Added default stalls: ${addedDefaultStalls}`);
  }

  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    await Category.insertMany([
      { name: "South Indian", createdBy: "system" },
      { name: "North Indian", createdBy: "system" },
      { name: "Chinese", createdBy: "system" },
      { name: "Fast Food", createdBy: "system" },
      { name: "Beverages", createdBy: "system" },
      { name: "Desserts", createdBy: "system" },
      { name: "Healthy Bowls", createdBy: "system" },
      { name: "Bakery", createdBy: "system" },
      { name: "Street Food", createdBy: "system" },
      { name: "Combos", createdBy: "system" },
    ]);
    console.log("Seeded default categories");
  }

  const allStalls = await Stall.find().select("_id stallName");

  const itemTemplates = [
    { name: "Idli", category: "South Indian", price: 40 },
    { name: "Sada Dosa", category: "South Indian", price: 55 },
    { name: "Masala Dosa", category: "South Indian", price: 70 },
    { name: "Mysore Masala Dosa", category: "South Indian", price: 85 },
    { name: "Rava Dosa", category: "South Indian", price: 75 },
    { name: "Sambar", category: "South Indian", price: 35 },
    { name: "Medu Vada", category: "South Indian", price: 45 },
    { name: "Onion Uttapam", category: "South Indian", price: 80 },
    { name: "Pongal", category: "South Indian", price: 65 },
    { name: "Biryani", category: "North Indian", price: 120 },
    { name: "Butter Chicken", category: "North Indian", price: 150 },
    { name: "Naan", category: "North Indian", price: 30 },
    { name: "Hakka Noodles", category: "Chinese", price: 80 },
    { name: "Fried Rice", category: "Chinese", price: 70 },
    { name: "Burger", category: "Fast Food", price: 90 },
    { name: "Pizza Slice", category: "Fast Food", price: 50 },
    { name: "Coffee", category: "Beverages", price: 30 },
    { name: "Juice", category: "Beverages", price: 40 },
    { name: "Gulab Jamun", category: "Desserts", price: 50 },
    { name: "Ice Cream", category: "Desserts", price: 70 },
    { name: "Salad Bowl", category: "Healthy Bowls", price: 100 },
    { name: "Bread Butter", category: "Bakery", price: 25 },
    { name: "Samosa", category: "Street Food", price: 20 },
    { name: "Chaat", category: "Street Food", price: 50 },
    { name: "Combo Meal 1", category: "Combos", price: 199 },
    { name: "Combo Meal 2", category: "Combos", price: 249 },
  ];

  let seededItemsCount = 0;
  for (const stall of allStalls) {
    const stallId = String(stall._id);
    const existingForStall = await MenuItem.find({ stallId }).select("name");
    const existingNames = new Set(
      existingForStall.map((item) => String(item.name || "").trim().toLowerCase())
    );

    const missingItems = itemTemplates
      .filter((item) => !existingNames.has(String(item.name).trim().toLowerCase()))
      .map((item) => ({
        stallId,
        name: item.name,
        category: item.category,
        price: item.price,
        description: `Delicious ${item.name} from ${stall.stallName || "Campus Stall"}`,
        status: "Available",
      }));

    if (missingItems.length > 0) {
      await MenuItem.insertMany(missingItems);
      seededItemsCount += missingItems.length;
    }
  }

  if (seededItemsCount > 0) {
    console.log(`Seeded ${seededItemsCount} missing menu items across stalls`);
  }
}
