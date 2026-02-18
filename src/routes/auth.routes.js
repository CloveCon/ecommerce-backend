import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase, { supabaseAdmin } from "../config/supabase.js";
import { userAuth } from "../middlewares/userAuthorization.js";

const router = express.Router();

const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: true, // Always secure for cross-origin
  sameSite: "none", // Always None for cross-origin
  maxAge: maxAgeMs,
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password required" });
    }

    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      return res.status(500).json({ error: "Failed to check user" });
    }

    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: user, error: createError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          name,
          email,
          phone: phone || null,
          password_hash: passwordHash,
          is_active: true,
        },
      ])
      .select("id, name, email, phone, is_active")
      .single();

    if (createError) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", token, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(201).json({
      message: "Registration successful",
      user,
    });
  } catch (err) {
    console.error("USER REGISTER ERROR:", err);
    return res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, phone, is_active, password_hash")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "User disabled" });
    }

    const match = await bcrypt.compare(password, user.password_hash || "");
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", token, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("USER LOGIN ERROR:", err);
    return res.status(500).json({ error: "Failed to login" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", getCookieOptions(0));
  res.json({ message: "Logged out" });
});

router.get("/me", userAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, date_of_birth, food_preference, allergies, is_active")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "User disabled" });
    }

    return res.json({
      id: user.id,
      name: user.name || "",
      email: user.email,
      date_of_birth: user.date_of_birth || null,
      food_preference: user.food_preference || null,
      allergies: user.allergies || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

router.patch("/me", userAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allowedFields = [
      "date_of_birth",
      "food_preference",
      "allergies",
      "email",
      "phone",
    ];
    const updates = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, name, email, phone, date_of_birth, food_preference, allergies, is_active")
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "User disabled" });
    }

    return res.json({
      message: "Profile updated",
      profile: {
        id: user.id,
        name: user.name || "",
        email: user.email,
        phone: user.phone || null,
        date_of_birth: user.date_of_birth || null,
        food_preference: user.food_preference || null,
        allergies: user.allergies || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
