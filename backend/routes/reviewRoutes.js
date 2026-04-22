import { Router } from "express";
import { createOrUpdateReview, getReviews } from "../controllers/Review.controller.js";

const router = Router();

router.get("/reviews", getReviews);
router.post("/reviews", createOrUpdateReview);

export default router;
