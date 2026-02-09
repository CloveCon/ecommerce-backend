import express from "express";
import { adminAuth } from "../middlewares/adminAuthorization.js";
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/admin.admins.controller.js";

const router = express.Router();

/**
 * GET ADMINS (OPTIONAL ROLE FILTER + SEARCH + PAGINATION)
 */
router.get("/", adminAuth, fetchAdmins);

/**
 * CREATE ADMIN
 */
router.post("/", adminAuth, createAdmin);

/**
 * UPDATE ADMIN
 */
router.patch("/:id", adminAuth, updateAdmin);

/**
 * DELETE ADMIN
 */
router.delete("/:id", adminAuth, deleteAdmin);

export default router;
