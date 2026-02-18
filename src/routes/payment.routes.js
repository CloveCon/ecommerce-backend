import express from "express";

import {
  createPayment,
  updatePaymentStatus,
  fetchPayments,
} from "../controllers/payments.controller.js";
import { verifyRazorpayPayment } from "../controllers/paymentVerify.controller.js";

const router = express.Router();

/**
 * CREATE PAYMENT
 */
router.post("/", createPayment);

/**
 * VERIFY RAZORPAY PAYMENT
 */
router.post("/verify", verifyRazorpayPayment);

/**
 * UPDATE PAYMENT STATUS
 */
router.put("/:id/status", updatePaymentStatus);

/**
 * GET PAYMENTS
 */
router.get("/", fetchPayments);

export default router;
