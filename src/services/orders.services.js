import supabase from "../config/supabase.js";

/**
 * CREATE ORDER
 */
export const createOrder = async ({ items, user_id }) => {
  if (!items || items.length === 0) {
    throw new Error("Order items required");
  }

  if (!user_id) {
    throw new Error("User ID required");
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        user_id,
        total_amount: total,
        order_status: "pending",
      },
    ])
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price: item.price,
  }));

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (orderItemsError) throw orderItemsError;

    // Decrement product stock for each item
  for (const item of items) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .single();
    if (productError) throw productError;
    const newStock = (product?.stock ?? 0) - item.quantity;
    // Prevent negative stock
    const updatedStock = newStock < 0 ? 0 : newStock;
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: updatedStock })
      .eq("id", item.product_id);
    if (updateError) throw updateError;
  }

  return order;
};

/**
 * GET ALL ORDERS
 */
export const getOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      order_status,
      payment_status,
      created_at,
      order_items (
        product_id,
        quantity,
        price
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

/**
 * UPDATE ORDER STATUS
 */
export const updateOrderStatus = async (id, status) => {
  const allowedStatuses = ["pending", "confirmed", "delivered", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid order status");
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("id", id)
    .select();

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("Order not found");
  }

  return data[0];
};

/**
 * GET ORDERS (SEARCH + FILTER + PAGINATION)
 */
export const getAdminOrders = async ({
  page = 1,
  limit = 10,
  search,
  status,
  from,
  to,
}) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("orders")
    .select(
      `
      id,
      total_amount,
      order_status,
      created_at,

      users (
        id,
        name
      ),

      order_items (
        quantity,
        product_name
      )
    `,
      { count: "exact" }
    );

  if (search) {
    query = query.eq("id", search);
  }

  if (status) {
    query = query.eq("order_status", status);
  }

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    page,
    limit,
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    data,
  };
};
