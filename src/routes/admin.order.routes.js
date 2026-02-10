import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import {
	fetchAdminOrders,
	fetchAdminOrderEta,
	fetchAdminOrdersEtaList,
	assignRiderToOrder,
} from "../controllers/admin.orders.controller.js";

const router = express.Router();

/**
 * GET ORDERS (SEARCH + FILTER + PAGINATION)
 */
router.get("/", adminAuth, fetchAdminOrders);

/**
 * GET ORDERS ETA LIST (Admin)
 */
router.get("/eta", adminAuth, fetchAdminOrdersEtaList);

/**
 * GET ORDER ETA (Admin)
 */
router.get("/:id/eta", adminAuth, fetchAdminOrderEta);

/**
 * ASSIGN RIDER TO ORDER (Admin)
 */
router.put("/:id/assign-rider", adminAuth, assignRiderToOrder);

export default router;
