import supabase from "../config/supabase.js";

export const addProductReview = async ({ userId, productId, rating, comment }) => {
  // 1️⃣ Validate required fields
  if (!userId) throw new Error("userId is required");
  if (!productId) throw new Error("productId is required");
  if (!rating) throw new Error("rating is required");
  if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");

  // 2️⃣ Check if user has ordered this product (any order_item with this product and user)
  const { data: orderItems, error: orderItemsError } = await supabase
    .from("order_items")
    .select("id, order_id")
    .eq("product_id", productId);
  if (orderItemsError) throw orderItemsError;
  if (!orderItems || orderItems.length === 0) throw new Error("You have not purchased this product");

  // 3️⃣ Check if any of these order_items belong to this user
  const orderIds = orderItems.map(oi => oi.order_id);
  const { data: userOrders, error: userOrdersError } = await supabase
    .from("orders")
    .select("id")
    .in("id", orderIds)
    .eq("user_id", userId);
  if (userOrdersError) throw userOrdersError;
  if (!userOrders || userOrders.length === 0) throw new Error("You have not purchased this product");

  // 4️⃣ Prevent duplicate review: only one review per product per user
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) throw new Error("You have already reviewed this product");

  // 5️⃣ Insert review (link to product and user, not order_item)
  const { data, error } = await supabase
    .from("reviews")
    .insert([{ user_id: userId, product_id: productId, rating, comment }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchProductReviews = async (productId) => {
  // Find all reviews for order_items with this product_id
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      users (name),
      order_items!inner (product_id, product_name)
    `)
    .eq("order_items.product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    customer: r.users?.name || "Guest",
    rating: r.rating,
    review: r.comment,
    date: r.created_at,
    product_id: r.order_items?.product_id,
    product: r.order_items?.product_name || "Unknown",
  }));
};
