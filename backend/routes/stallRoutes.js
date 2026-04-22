import { Router } from "express";
import {
  createMenuItem,
  createStall,
  deleteMenuItem,
  deleteStall,
  getAllStalls,
  getMenuItems,
  getMenuItemsByStall,
  getStallByOwnerEmail,
  updateMenuItem,
  updateStall,
} from "../controllers/Stall.controller.js";

const router = Router();

router.get("/stalls", getAllStalls);
router.get("/stalls/owner/:email", getStallByOwnerEmail);
router.post("/stalls", createStall);
router.put("/stalls/:id", updateStall);
router.delete("/stalls/:id", deleteStall);

router.get("/menu-items", getMenuItems);
router.get("/menu-items/stall/:stallId", getMenuItemsByStall);
router.post("/menu-items", createMenuItem);
router.put("/menu-items/:id", updateMenuItem);
router.delete("/menu-items/:id", deleteMenuItem);

export default router;
