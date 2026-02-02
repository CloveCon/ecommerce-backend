import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import { fetchAdminOrders } from "../controllers/admin.orders.controller.js";

const router = express.Router();

/**
 * GET ORDERS (SEARCH + FILTER + PAGINATION)
 */
router.get("/", adminAuth, fetchAdminOrders);

export default router;
