import express from "express";
import supabase from "../config/supabase.js";
import { adminAuth } from "../middlewares/adminAuthorization.js";

const router = express.Router();

// GET all categories (admin only)
router.get("/", adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
});

export default router;
