import Review from "../models/Review.js";
import Stall from "../models/Stall.js";
import { recordActivity } from "../services/activityLogger.js";

async function syncStallRating(stallId) {
  const aggregate = await Review.aggregate([
    { $match: { stallId: String(stallId) } },
    {
      $group: {
        _id: "$stallId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const summary = aggregate[0] || { averageRating: 0, totalReviews: 0 };
  const roundedRating = Number(Number(summary.averageRating || 0).toFixed(1));

  await Stall.findByIdAndUpdate(stallId, {
    rating: roundedRating,
    reviewsCount: Number(summary.totalReviews || 0),
  });

  return {
    averageRating: roundedRating,
    totalReviews: Number(summary.totalReviews || 0),
  };
}

export const getReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.stallId) {
      filter.stallId = String(req.query.stallId);
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrUpdateReview = async (req, res) => {
  try {
    const payload = req.body || {};
    const stallId = String(payload.stallId || "").trim();
    const stallName = String(payload.stallName || "").trim();
    const studentEmail = String(payload.studentEmail || "").trim().toLowerCase();
    const studentName = String(payload.studentName || "").trim();
    const rating = Number(payload.rating);
    const reviewText = String(payload.review || "").trim();

    if (!stallId || !studentEmail || !studentName || !stallName) {
      return res.status(400).json({ success: false, message: "Missing required review fields" });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const review = await Review.findOneAndUpdate(
      { stallId, studentEmail },
      {
        stallName,
        studentName,
        rating,
        review: reviewText,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    const summary = await syncStallRating(stallId);

    await recordActivity({
      actorName: studentName,
      actorEmail: studentEmail,
      actorRole: "student",
      action: "stall_review_submitted",
      entityType: "review",
      entityId: String(review._id),
      entityName: stallName,
      details: `Review submitted for ${stallName} (${rating} star)`,
      metadata: { stallId, rating },
    });

    return res.status(200).json({
      success: true,
      review,
      summary,
      message: "Review submitted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
