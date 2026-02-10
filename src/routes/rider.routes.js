import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import {
  fetchRiderDeliveries,
  updateRiderStatus,
  updateRiderAvailabilityStatus,
  fetchRiderDeliveryEta,
} from "../controllers/riders.controller.js";

const router = express.Router();

/**
 * GET ASSIGNED DELIVERIES (Rider)
 */
router.get("/deliveries", adminAuth, fetchRiderDeliveries);

/**
 * UPDATE DELIVERY STATUS (Rider)
 */
router.put("/deliveries/:id/status", adminAuth, updateRiderStatus);

/**
 * UPDATE RIDER AVAILABILITY (Rider)
 */
router.put("/availability", adminAuth, updateRiderAvailabilityStatus);

/**
 * GET DELIVERY ETA (Rider)
 */
router.get("/deliveries/:id/eta", adminAuth, fetchRiderDeliveryEta);

export default router;
