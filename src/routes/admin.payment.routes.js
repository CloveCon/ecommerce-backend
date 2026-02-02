import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import {
  fetchPaymentsWithStats,
  updatePaymentStatus,
} from "../controllers/admin.payments.controller.js";

const router = express.Router();

/**
 * GET ALL PAYMENTS + STATS
 */
router.get("/", adminAuth, fetchPaymentsWithStats);

/**
 * UPDATE PAYMENT STATUS
 */
router.put("/:id/status", adminAuth, updatePaymentStatus);

export default router;
