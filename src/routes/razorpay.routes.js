import express from "express";
import { createOrder } from "../controllers/razorpay.controller.js";
import { razorpayWebhook } from "../controllers/razorpayWebhook.controller.js";

const router = express.Router();

// POST /api/razorpay/order

router.post("/order", createOrder);
// POST /api/razorpay/webhook
router.post("/webhook", razorpayWebhook);

export default router;
