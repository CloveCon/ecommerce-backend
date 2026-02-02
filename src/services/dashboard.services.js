import supabase from "../config/supabase.js";

export const getDashboardStats = async () => {
  /** -------------------
   * TOTAL ORDERS
   --------------------*/
  const { count: totalOrders, error: totalOrdersError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  if (totalOrdersError) throw totalOrdersError;

  /** -------------------
   * PENDING / COMPLETED
   --------------------*/
  const { count: pendingOrders, error: pendingOrdersError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("order_status", "pending");

  if (pendingOrdersError) throw pendingOrdersError;

  const { count: completedOrders, error: completedOrdersError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("order_status", "delivered");

  if (completedOrdersError) throw completedOrdersError;

  /** -------------------
   * TOTAL REVENUE
   --------------------*/
  const { data: revenueRows, error: revenueRowsError } = await supabase
    .from("orders")
    .select("total_amount");

  if (revenueRowsError) throw revenueRowsError;

  const totalRevenue =
    revenueRows?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;

  /** -------------------
   * REVENUE BY DAY (LAST 7 DAYS)
   --------------------*/
  const { data: revenueTrend, error: revenueTrendError } = await supabase.rpc(
    "get_weekly_revenue"
  );

  if (revenueTrendError) throw revenueTrendError;

  /** -------------------
   * TOP PRODUCT
   --------------------*/
  const { data: topProduct, error: topProductError } = await supabase
    .from("order_items")
    .select("product_id, quantity, products(name)")
    .order("quantity", { ascending: false })
    .limit(1);

  if (topProductError) throw topProductError;

  /** -------------------
   * AVERAGE RATING
   --------------------*/
  const { data: ratings, error: ratingsError } = await supabase
    .from("reviews")
    .select("rating");

  if (ratingsError) throw ratingsError;

  const avgRating =
    ratings?.reduce((sum, r) => sum + r.rating, 0) /
      (ratings?.length || 1) || 0;

  /** -------------------
   * TOTAL CUSTOMERS
   --------------------*/
  const { count: totalCustomers, error: totalCustomersError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (totalCustomersError) throw totalCustomersError;

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    totalCustomers,
    revenueTrend,
    topProduct: topProduct?.[0]?.products?.name || "N/A",
    avgRating: avgRating.toFixed(1),
  };
};
