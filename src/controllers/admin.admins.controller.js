import bcrypt from "bcryptjs";
import {
  getAdmins,
  createAdminEntry,
  updateAdminById,
  deleteAdminById,
} from "../services/admins.services.js";

export const fetchAdmins = async (req, res) => {
  try {
    const role = req.query.role || "";
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getAdmins({ role, search, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, is_active } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Name, email, password and role required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { admin, conflict } = await createAdminEntry({
      name,
      email,
      role,
      isActive: is_active,
      passwordHash,
    });

    if (conflict) {
      return res.status(409).json({ error: "Email already registered" });
    }

    return res.status(201).json({
      message: "Admin created",
      admin,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create admin" });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const payload = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      is_active: req.body.is_active,
    };

    const hasUpdates = Object.values(payload).some(
      (value) => value !== undefined
    );

    if (!hasUpdates) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await updateAdminById({ adminId, payload });

    if (!updated) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update admin" });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const requesterId = req.admin?.id;

    if (requesterId && adminId === requesterId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const deleted = await deleteAdminById({ adminId });

    if (!deleted) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ message: "Admin deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete admin" });
  }
};
