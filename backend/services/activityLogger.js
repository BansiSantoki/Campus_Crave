import ActivityLog from "../models/ActivityLog.js";

export async function recordActivity(activity) {
  try {
    return await ActivityLog.create({
      actorName: activity.actorName || "System",
      actorEmail: String(activity.actorEmail || "").toLowerCase(),
      actorRole: activity.actorRole || "system",
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId || "",
      entityName: activity.entityName || "",
      details: activity.details || "",
      metadata: activity.metadata || {},
    });
  } catch (error) {
    console.error("Failed to record activity:", error.message);
    return null;
  }
}
