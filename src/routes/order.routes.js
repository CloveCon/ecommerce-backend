import express from "express";
import {
  createOrder,
  fetchOrders,
  updateOrderStatus,
} from "../controllers/orders.controller.js";

const router = express.Router();

router.post("/", createOrder);

/**
 * GET ALL ORDERS
 */
router.get("/", fetchOrders);

/**
 * UPDATE ORDER STATUS
 */
router.put("/:id/status", updateOrderStatus);

export default router;
