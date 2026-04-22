import Category from "../models/Category.js";
import { recordActivity } from "../services/activityLogger.js";

function escapeRegex(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCategoryFilter(query = {}) {
  const filter = {};
  const search = String(query.search || query.q || "").trim();

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  if (query.status) {
    filter.status = String(query.status);
  }

  return filter;
}

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find(buildCategoryFilter(req.query)).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const payload = req.body || {};
    const name = String(payload.name || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existing = await Category.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } });
    if (existing) {
      if (payload.description !== undefined) existing.description = payload.description;
      if (payload.status) existing.status = payload.status;
      await existing.save();

      return res.status(200).json({ success: true, category: existing, message: "Category already exists" });
    }

    const category = await Category.create({
      name,
      description: payload.description || "",
      status: payload.status || "Active",
      createdBy: payload.createdBy || "admin",
    });

    await recordActivity({
      actorName: payload.createdBy || "Admin",
      actorEmail: payload.createdByEmail || "",
      actorRole: "admin",
      action: "category_created",
      entityType: "category",
      entityId: String(category._id),
      entityName: category.name,
      details: `Category ${category.name} was created`,
      metadata: { status: category.status },
    });

    return res.status(201).json({ success: true, category, message: "Category created successfully" });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const payload = req.body || {};
    const updatePayload = {
      name: payload.name,
      description: payload.description,
      status: payload.status,
    };

    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const category = await Category.findByIdAndUpdate(req.params.id, updatePayload, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await recordActivity({
      actorName: payload.updatedBy || "Admin",
      actorEmail: payload.updatedByEmail || "",
      actorRole: "admin",
      action: "category_updated",
      entityType: "category",
      entityId: String(category._id),
      entityName: category.name,
      details: `Category ${category.name} was updated`,
      metadata: { status: category.status },
    });

    return res.status(200).json({ success: true, category, message: "Category updated successfully" });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await recordActivity({
      actorName: req.body?.deletedBy || "Admin",
      actorEmail: req.body?.deletedByEmail || "",
      actorRole: "admin",
      action: "category_deleted",
      entityType: "category",
      entityId: String(category._id),
      entityName: category.name,
      details: `Category ${category.name} was deleted`,
      metadata: { status: category.status },
    });

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export async function ensureCategoryExists(name, extra = {}) {
  const categoryName = String(name || "").trim();
  if (!categoryName) {
    return null;
  }

  const existing = await Category.findOne({ name: { $regex: `^${escapeRegex(categoryName)}$`, $options: "i" } });
  if (existing) {
    return existing;
  }

  return Category.create({
    name: categoryName,
    description: extra.description || "",
    status: extra.status || "Active",
    createdBy: extra.createdBy || "system",
  });
}