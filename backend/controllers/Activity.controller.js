import ActivityLog from "../models/ActivityLog.js";

export const getRecentActivities = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, activities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
