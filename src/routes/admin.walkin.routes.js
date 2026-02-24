import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import {
    createNewWalkInOrder,
    fetchActiveWalkInOrders,
    updateWalkInStatus,
} from "../controllers/admin.walkin.controller.js";

const router = express.Router();

/**
 * GET ACTIVE WALK-IN ORDERS (today's)
 */
router.get("/orders", adminAuth, fetchActiveWalkInOrders);

/**
 * CREATE WALK-IN ORDER
 */
router.post("/orders", adminAuth, createNewWalkInOrder);

/**
 * UPDATE WALK-IN ORDER STATUS
 */
router.put("/orders/:id/status", adminAuth, updateWalkInStatus);

export default router;
