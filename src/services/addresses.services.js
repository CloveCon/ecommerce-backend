import { supabaseAdmin } from "../config/supabase.js";

const ADDRESS_FIELDS = [
  "id",
  "user_id",
  "full_name",
  "phone",
  "line1",
  "line2",
  "city",
  "state",
  "postal_code",
  "country",
  "is_default",
  "created_at",
  "updated_at",
];

export const listAddresses = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from("user_addresses")
    .select(ADDRESS_FIELDS.join(", "))
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
};

export const createAddress = async (userId, payload) => {
  if (payload.is_default === true) {
    const { error: clearError } = await supabaseAdmin
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", userId);

    if (clearError) throw clearError;
  }

  const { data, error } = await supabaseAdmin
    .from("user_addresses")
    .insert([
      {
        user_id: userId,
        full_name: payload.full_name,
        phone: payload.phone,
        line1: payload.line1,
        line2: payload.line2 || null,
        city: payload.city,
        state: payload.state,
        postal_code: payload.postal_code,
        country: payload.country,
        is_default: payload.is_default || false,
      },
    ])
    .select(ADDRESS_FIELDS.join(", "))
    .single();

  if (error) throw error;

  return data;
};

export const updateAddress = async (userId, addressId, updates) => {
  if (updates.is_default === true) {
    const { error: clearError } = await supabaseAdmin
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", userId);

    if (clearError) throw clearError;
  }

  const { data, error } = await supabaseAdmin
    .from("user_addresses")
    .update(updates)
    .eq("id", addressId)
    .eq("user_id", userId)
    .select(ADDRESS_FIELDS.join(", "))
    .single();

  if (error) throw error;
  if (!data) throw new Error("Address not found");

  return data;
};

export const deleteAddress = async (userId, addressId) => {
  const { data, error } = await supabaseAdmin
    .from("user_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Address not found");

  return data[0];
};
