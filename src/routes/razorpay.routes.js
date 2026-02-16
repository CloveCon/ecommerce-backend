import express from "express";
import { createOrder } from "../controllers/razorpay.controller.js";

const router = express.Router();

// POST /api/razorpay/order
router.post("/order", createOrder);

export default router;
