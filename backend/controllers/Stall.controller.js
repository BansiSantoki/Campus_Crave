import Stall from "../models/Stall.js";
import MenuItem from "../models/MenuItem.js";
import { recordActivity } from "../services/activityLogger.js";

export const getAllStalls = async (_req, res) => {
  try {
    const stalls = await Stall.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, stalls });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStallByOwnerEmail = async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase();
    const stall = await Stall.findOne({ ownerEmail: email });

    if (!stall) {
      return res.status(404).json({ success: false, message: "Stall not found for this owner" });
    }

    return res.status(200).json({ success: true, stall });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createStall = async (req, res) => {
  try {
    const payload = req.body || {};
    const stall = await Stall.create({
      stallName: payload.stallName,
      owner: payload.owner,
      ownerEmail: String(payload.ownerEmail || "").toLowerCase(),
      contact: payload.contact,
      cuisine: payload.cuisine,
      status: payload.status || "Active",
      rating: payload.rating || 4.2,
      ordersCount: payload.ordersCount || 0,
      hours: payload.hours || "9:00 AM - 6:00 PM",
      specialties: Array.isArray(payload.specialties) ? payload.specialties : [],
      description: payload.description || "Popular campus food stall serving fresh meals.",
    });

    await recordActivity({
      actorName: stall.owner,
      actorEmail: stall.ownerEmail,
      actorRole: "stall",
      action: "stall_created",
      entityType: "stall",
      entityId: String(stall._id),
      entityName: stall.stallName,
      details: `Stall ${stall.stallName} was added`,
      metadata: { cuisine: stall.cuisine, status: stall.status },
    });

    return res.status(201).json({ success: true, stall, message: "Stall created successfully" });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "A stall for this owner email already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStall = async (req, res) => {
  try {
    const payload = req.body || {};
    const updatePayload = {
      stallName: payload.stallName,
      owner: payload.owner,
      ownerEmail: payload.ownerEmail ? String(payload.ownerEmail).toLowerCase() : undefined,
      contact: payload.contact,
      cuisine: payload.cuisine,
      status: payload.status,
      rating: payload.rating,
      ordersCount: payload.ordersCount,
      hours: payload.hours,
      specialties: payload.specialties,
      description: payload.description,
    };

    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const stall = await Stall.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!stall) {
      return res.status(404).json({ success: false, message: "Stall not found" });
    }

    await recordActivity({
      actorName: stall.owner,
      actorEmail: stall.ownerEmail,
      actorRole: "stall",
      action: "stall_updated",
      entityType: "stall",
      entityId: String(stall._id),
      entityName: stall.stallName,
      details: `Stall ${stall.stallName} was updated`,
      metadata: { cuisine: stall.cuisine, status: stall.status },
    });

    return res.status(200).json({ success: true, stall, message: "Stall updated successfully" });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "A stall for this owner email already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStall = async (req, res) => {
  try {
    const stall = await Stall.findByIdAndDelete(req.params.id);
    if (!stall) {
      return res.status(404).json({ success: false, message: "Stall not found" });
    }

    await MenuItem.deleteMany({ stallId: String(stall._id) });

    await recordActivity({
      actorName: stall.owner,
      actorEmail: stall.ownerEmail,
      actorRole: "stall",
      action: "stall_deleted",
      entityType: "stall",
      entityId: String(stall._id),
      entityName: stall.stallName,
      details: `Stall ${stall.stallName} was deleted`,
      metadata: { cuisine: stall.cuisine, status: stall.status },
    });

    return res.status(200).json({ success: true, message: "Stall deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMenuItems = async (req, res) => {
  try {
    const filter = {};
    if (req.query.stallId) {
      filter.stallId = String(req.query.stallId);
    }

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMenuItemsByStall = async (req, res) => {
  try {
    const items = await MenuItem.find({ stallId: String(req.params.stallId) }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const payload = req.body || {};
    const item = await MenuItem.create({
      stallId: String(payload.stallId),
      name: payload.name,
      category: payload.category,
      price: Number(payload.price),
      description: payload.description || "",
      status: payload.status || "Available",
      image: payload.image || "",
    });

    await recordActivity({
      actorName: payload.owner || "Stall Owner",
      actorEmail: payload.ownerEmail || "",
      actorRole: "stall",
      action: "menu_item_created",
      entityType: "menu-item",
      entityId: String(item._id),
      entityName: item.name,
      details: `Menu item ${item.name} was added`,
      metadata: { stallId: item.stallId, category: item.category, price: item.price },
    });

    return res.status(201).json({ success: true, item, message: "Menu item created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const payload = req.body || {};
    const updatePayload = {
      stallId: payload.stallId ? String(payload.stallId) : undefined,
      name: payload.name,
      category: payload.category,
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      description: payload.description,
      status: payload.status,
      image: payload.image,
    };

    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    await recordActivity({
      actorName: "Stall Owner",
      actorRole: "stall",
      action: "menu_item_updated",
      entityType: "menu-item",
      entityId: String(item._id),
      entityName: item.name,
      details: `Menu item ${item.name} was updated`,
      metadata: { stallId: item.stallId, category: item.category, price: item.price },
    });

    return res.status(200).json({ success: true, item, message: "Menu item updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    await recordActivity({
      actorName: "Stall Owner",
      actorRole: "stall",
      action: "menu_item_deleted",
      entityType: "menu-item",
      entityId: String(item._id),
      entityName: item.name,
      details: `Menu item ${item.name} was deleted`,
      metadata: { stallId: item.stallId, category: item.category, price: item.price },
    });

    return res.status(200).json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
