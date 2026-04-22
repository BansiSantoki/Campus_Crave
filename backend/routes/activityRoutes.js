import { Router } from "express";
import { getRecentActivities } from "../controllers/Activity.controller.js";

const router = Router();

router.get("/activities", getRecentActivities);

export default router;
