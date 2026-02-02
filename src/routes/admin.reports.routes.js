import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import { fetchReports } from "../controllers/admin.reports.controller.js";

const router = express.Router();

router.get("/", adminAuth, fetchReports);

export default router;

