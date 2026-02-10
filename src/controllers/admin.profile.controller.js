import bcrypt from "bcryptjs";
import { updateAdminById } from "../services/admins.services.js";
import supabase, { supabaseAdmin } from "../config/supabase.js";

// Update profile (name, email)
export const updateAdminProfile = async (req, res) => {
  try {
    console.log('ADMIN PROFILE req.admin:', req.admin);
    const adminId = req.admin?.id;
    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { name, email } = req.body;
    if (!name && !email) {
      return res.status(400).json({ error: "No fields to update" });
    }
    const updated = await updateAdminById({ adminId, payload: { name, email } });
    if (!updated) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json({ message: "Profile updated", admin: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Update password
export const updateAdminPassword = async (req, res) => {
  try {
    console.log('ADMIN PASSWORD req.admin:', req.admin);
    const adminId = req.admin?.id;
    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All password fields are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    // Fetch admin's current password hash
    const { data: admin, error } = await supabaseAdmin
      .from("admins")
      .select("id, password_hash")
      .eq("id", adminId)
      .single();
    if (error || !admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateAdminById({ adminId, payload: { password_hash: passwordHash } });
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update password" });
  }
};
