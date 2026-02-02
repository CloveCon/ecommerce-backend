import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import { fetchCustomers } from "../controllers/admin.customers.controller.js";

const router = express.Router();

/**
 * GET CUSTOMERS (SEARCH + PAGINATION)
 */
router.get("/", adminAuth, fetchCustomers);

export default router;
