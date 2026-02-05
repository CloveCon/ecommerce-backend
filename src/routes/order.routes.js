import express from "express";
import {
  createOrder,
  fetchOrders,
  fetchMyOrders,
  updateOrderStatus,
} from "../controllers/orders.controller.js";
import { userAuth } from "../middlewares/userAuthorization.js";

const router = express.Router();

router.post("/", createOrder);

/**
 * GET ALL ORDERS
 */
router.get("/", fetchOrders);

/**
 * GET MY ORDERS (User Profile)
 */
router.get("/me", userAuth, fetchMyOrders);

/**
 * UPDATE ORDER STATUS
 */
router.put("/:id/status", updateOrderStatus);

export default router;
