import express from "express";
import {
  createOrder,
  fetchOrders,
  fetchMyOrders,
  fetchOrderEta,
  fetchMyOrdersEtaList,
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
 * GET MY ORDERS ETA LIST (User)
 */
router.get("/me/eta", userAuth, fetchMyOrdersEtaList);

/**
 * GET ORDER ETA (User)
 */
router.get("/:id/eta", userAuth, fetchOrderEta);

/**
 * UPDATE ORDER STATUS
 */
router.put("/:id/status", updateOrderStatus);

export default router;
