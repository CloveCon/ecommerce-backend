import express from "express";
import { fetchReviewsByProduct } from "../controllers/reviews.controller.js";

const router = express.Router();

/**
 * GET REVIEWS BY PRODUCT ID (Public)
 * /api/reviews?product_id=123
 */
router.get("/", fetchReviewsByProduct);

export default router;
