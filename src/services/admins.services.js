import supabase, { supabaseAdmin } from "../config/supabase.js";

const normalizePayload = (payload) => {
  const cleaned = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) cleaned[key] = value;
  });
  return cleaned;
};

/**
 * GET ADMINS (OPTIONAL ROLE FILTER + SEARCH + PAGINATION)
 */
export const getAdmins = async ({ role = "", search = "", page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("admins")
    .select("id, name, email, role, is_active, created_at", {
      count: "exact",
    })
    .range(offset, offset + limit - 1);

  if (role) {
    query = query.eq("role", role);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: admins, count, error } = await query;

  if (error) throw error;

  return {
    data: admins,
    totalRecords: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};

/**
 * CREATE ADMIN
 */
export const createAdminEntry = async ({
  name,
  email,
  role,
  isActive,
  passwordHash,
}) => {
  const { data: existingAdmin, error: existingError } = await supabaseAdmin
    .from("admins")
    .select("id")
    .eq("email", email)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  if (existingAdmin) {
    return { admin: null, conflict: true };
  }

  const { data: admin, error } = await supabaseAdmin
    .from("admins")
    .insert([
      {
        name,
        email,
        role,
        is_active: isActive ?? true,
        password_hash: passwordHash,
      },
    ])
    .select("id, name, email, role, is_active")
    .single();

  if (error) throw error;

  return { admin, conflict: false };
};

/**
 * UPDATE ADMIN BY ID
 */
export const updateAdminById = async ({ adminId, payload }) => {
  const updateData = normalizePayload(payload);

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  const { data: admin, error } = await supabaseAdmin
    .from("admins")
    .update(updateData)
    .eq("id", adminId)
    .select("id, name, email, role, is_active")
    .single();

  if (error) throw error;

  return admin;
};

/**
 * DELETE ADMIN BY ID
 */
export const deleteAdminById = async ({ adminId }) => {
  const { data: admin, error } = await supabaseAdmin
    .from("admins")
    .delete()
    .eq("id", adminId)
    .select("id")
    .single();

  if (error) throw error;

  return admin;
};
