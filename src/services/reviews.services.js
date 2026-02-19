import supabase from "../config/supabase.js";

/**
 * GET ALL REVIEWS (Admin)
 */
export const getReviews = async () => {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      users (
        name,
        email
      ),
      products (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    customer: r.users?.name || "Guest",
    email: r.users?.email || "",
    rating: r.rating,
    review: r.comment,
    date: r.created_at,
    product: r.products?.name || "Unknown",
  }));
};

/**
 * CREATE REVIEW (Admin / System)
 */
export const createReview = async ({ user_id, order_item_id, rating, comment }) => {
  if (!user_id || !order_item_id || !rating) {
    throw new Error("Missing required fields");
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert([
      {
        user_id,
        order_item_id,
        rating,
        comment,
      },
    ])
    .select();

  if (error) throw error;

  return data[0];
};

/**
 * GET REVIEWS BY PRODUCT ID (Public)
 */
export const getReviewsByProductId = async (productId) => {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      users (
        name
      ),
      products (
        id,
        name
      )
    `)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    customer: r.users?.name || "Guest",
    rating: r.rating,
    review: r.comment,
    date: r.created_at,
    product_id: r.products?.id,
    product: r.products?.name || "Unknown",
  }));
};

