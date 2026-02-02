import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";

import {
  fetchProducts,
  fetchProductStats,
  addProduct,
  editProduct,
  removeProduct,
} from "../controllers/admin.products.controller.js";

const router = express.Router();

// Get products (search + stock filter)
router.get("/", fetchProducts);

// Product stats (total / low / out of stock)
router.get("/stats", fetchProductStats);

// Add new product
router.post("/", adminAuth, addProduct);

// Update product
router.put("/:id", adminAuth, editProduct);

// Delete product
router.delete("/:id", adminAuth, removeProduct);

export default router;
