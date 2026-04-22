import mongoose from "mongoose";
import Register from "../models/Register.js";
import Stall from "../models/Stall.js";

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
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    syncedCount += 1;
  }

  if (syncedCount > 0) {
    console.log(`Synced stalls from existing stall owners: ${syncedCount}`);
  }
}
