import { supabaseAdmin } from "../config/supabase.js";
import { getOrderEta } from "./orders.services.js";

const mapRiderStatus = (status) => {
  const normalized = String(status || "").toLowerCase();
  const map = {
    assigned: "confirmed",
    out_for_delivery: "dispatched",
    delivered: "delivered",
    confirmed: "confirmed",
    dispatched: "dispatched",
    cancelled: "cancelled",
  };

  if (!map[normalized]) {
    throw new Error("Invalid delivery status");
  }

  return map[normalized];
};

export const getRiderDeliveries = async ({
  riderId,
  page = 1,
  limit = 10,
  status,
  from,
  to,
  activeOnly = false,
}) => {
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("orders")
    .select(
      "id, user_id, address_id, total_amount, order_status, payment_status, created_at, rider_id",
      { count: "exact" }
    );

  if (riderId) {
    query = query.eq("rider_id", riderId);
  }

  if (status) {
    query = query.eq("order_status", status);
  } else if (activeOnly) {
    query = query.in("order_status", ["confirmed", "dispatched"]);
  }

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: orders, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const orderList = orders || [];
  const userIds = Array.from(new Set(orderList.map((order) => order.user_id).filter(Boolean)));
  const addressIds = Array.from(new Set(orderList.map((order) => order.address_id).filter(Boolean)));
  const orderIds = orderList.map((order) => order.id);

  const [{ data: users, error: usersError }, { data: addresses, error: addressesError }] =
    await Promise.all([
      userIds.length
        ? supabaseAdmin
            .from("users")
            .select("id, name, phone")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      addressIds.length
        ? supabaseAdmin
            .from("user_addresses")
            .select(
              "id, full_name, phone, line1, line2, city, state, postal_code, country, latitude, longitude"
            )
            .in("id", addressIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (usersError) throw usersError;
  if (addressesError) throw addressesError;

  const { data: items, error: itemsError } = orderIds.length
    ? await supabaseAdmin
      .from("order_items")
      .select("order_id, product_id, product_name, quantity, price_at_purchase")
      .in("order_id", orderIds)
    : { data: [], error: null };

  if (itemsError) throw itemsError;

  const userMap = new Map((users || []).map((user) => [user.id, user]));
  const addressMap = new Map((addresses || []).map((address) => [address.id, address]));
  const itemsByOrder = new Map();

  (items || []).forEach((item) => {
    const existing = itemsByOrder.get(item.order_id) || [];
    existing.push(item);
    itemsByOrder.set(item.order_id, existing);
  });

  const deliveries = orderList.map((order) => ({
    order_id: order.id,
    status: order.order_status,
    payment_status: order.payment_status,
    total_amount: order.total_amount,
    created_at: order.created_at,
    customer: userMap.get(order.user_id) || null,
    address: addressMap.get(order.address_id) || null,
    items: itemsByOrder.get(order.id) || [],
  }));

  return {
    page,
    limit,
    totalRecords: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    data: deliveries,
  };
};

export const updateRiderDeliveryStatus = async ({ riderId, orderId, status }) => {
  const mappedStatus = mapRiderStatus(status);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      order_status: mappedStatus,
    })
    .eq("id", orderId)
    .eq("rider_id", riderId)
    .select("id, order_status")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Order not found or not assigned");

  return data;
};

export const updateRiderAvailability = async ({ riderId, isActive }) => {
  const { data, error } = await supabaseAdmin
    .from("admins")
    .update({
      is_active: isActive,
    })
    .eq("id", riderId)
    .select("id, role, is_active")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Rider not found");

  return data;
};

export const getRiderDeliveryEta = async ({ riderId, orderId }) => {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("rider_id", riderId)
    .single();

  if (error) throw error;
  if (!order) throw new Error("Order not found or not assigned");

  return getOrderEta({ orderId });
};
