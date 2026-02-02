import express from "express";
import {
  createPayment,
  updatePaymentStatus,
  fetchPayments,
} from "../controllers/payments.controller.js";

const router = express.Router();

/**
 * CREATE PAYMENT
 */
router.post("/", createPayment);

/**
 * UPDATE PAYMENT STATUS
 */
router.put("/:id/status", updatePaymentStatus);

/**
 * GET PAYMENTS
 */
router.get("/", fetchPayments);

export default router;
