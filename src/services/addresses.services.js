import { supabaseAdmin } from "../config/supabase.js";

const GEOCODE_ENDPOINT = "https://api.openrouteservice.org/geocode/search";

const getGeocodeApiKey = () => {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouteService API key missing");
  }

  return apiKey;
};

const buildGeocodeQuery = (payload) => {
  const parts = [
    payload.line1,
    payload.line2,
    payload.city,
    payload.state,
    payload.postal_code,
    payload.country,
  ].filter((value) => Boolean(value));

  return parts.join(", ");
};

const geocodeAddress = async (payload) => {
  const text = buildGeocodeQuery(payload);
  if (!text) {
    throw new Error("Address missing for geocoding");
  }

  const apiKey = getGeocodeApiKey();
  const url = new URL(GEOCODE_ENDPOINT);
  url.searchParams.set("text", text);
  url.searchParams.set("size", "1");
  if (payload.country) {
    url.searchParams.set("boundary.country", payload.country.toUpperCase());
  }

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouteService geocode error: ${response.status} ${response.statusText} ${errorText}`
    );
  }

  const payloadData = await response.json();
  const coordinates = payloadData?.features?.[0]?.geometry?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("Geocoding failed");
  }

  return {
    longitude: Number(coordinates[0]),
    latitude: Number(coordinates[1]),
  };
};

const hasAddressFields = (payload) => {
  const fields = [
    "line1",
    "line2",
    "city",
    "state",
    "postal_code",
    "country",
  ];

  return fields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
};

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
  "latitude",
  "longitude",
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
        ...(payload.latitude != null && payload.longitude != null
          ? {
              latitude: payload.latitude,
              longitude: payload.longitude,
            }
          : await geocodeAddress(payload)),
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

  if (
    updates.latitude == null ||
    updates.longitude == null
  ) {
    if (hasAddressFields(updates)) {
      const coords = await geocodeAddress(updates);
      updates.latitude = coords.latitude;
      updates.longitude = coords.longitude;
    }
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
