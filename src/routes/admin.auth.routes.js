import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";
import { adminAuth } from "../middlewares/adminAuthorization.js";

const router = express.Router();

const getCookieOptions = (maxAgeMs) => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: maxAgeMs,
  };
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();

  if (!admin || error)
    return res.status(401).json({ error: "Invalid credentials" });

  if (!admin.is_active)
    return res.status(403).json({ error: "Admin disabled" });

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("admin_token", token, getCookieOptions(24 * 60 * 60 * 1000));

  res.json({
    message: "Login successful"
  });
});

router.get("/me", adminAuth, async (req, res) => {
  try {
    const adminId = req.admin?.id;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, name, email, role, is_active")
      .eq("id", adminId)
      .single();

    if (error || !admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: "Admin disabled" });
    }

    return res.json({
      id: admin.id,
      name: admin.name || "",
      email: admin.email,
      role: admin.role,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", getCookieOptions(0));
  res.json({ message: "Logged out" });
});

export default router;
