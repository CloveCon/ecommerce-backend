import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import { fetchReviews, addReview } from "../controllers/admin.reviews.controller.js";

const router = express.Router();

/**
 * GET ALL REVIEWS (Admin)
 */
router.get("/", adminAuth, fetchReviews);

/**
 * CREATE REVIEW (Admin / System)
 */
router.post("/", adminAuth, addReview);

export default router;
