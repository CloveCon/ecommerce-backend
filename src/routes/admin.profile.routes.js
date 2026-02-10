import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import {
  updateAdminProfile,
  updateAdminPassword,
} from "../controllers/admin.profile.controller.js";

const router = express.Router();

// Update profile (name, email)
router.put("/profile", adminAuth, updateAdminProfile);

// Update password
router.put("/password", adminAuth, updateAdminPassword);

export default router;
