import express from "express";
import { createProductReview, getProductReviews } from "../controllers/product.reviews.controller.js";
import { userAuth } from "../middlewares/userAuthorization.js";

const router = express.Router({ mergeParams: true });

router.post("/", userAuth, createProductReview);
router.get("/", getProductReviews);

export default router;
