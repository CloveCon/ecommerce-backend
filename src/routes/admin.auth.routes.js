import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

const router = express.Router();

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

  res.json({
    message: "Login successful",
    token
  });
});

export default router;
