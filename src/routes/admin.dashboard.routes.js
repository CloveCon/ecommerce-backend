import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import { fetchDashboardStats } from "../controllers/admin.dashboard.controller.js";

const router = express.Router();

router.get("/stats", adminAuth, fetchDashboardStats);

export default router;
