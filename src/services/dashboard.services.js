import supabase from "../config/supabase.js";

export const getDashboardStats = async () => {
  const [
    { count: totalOrders, error: totalOrdersError },
    { count: pendingOrders, error: pendingOrdersError },
    { count: completedOrders, error: completedOrdersError },
    { data: revenueRows, error: revenueRowsError },
    { data: revenueTrend, error: revenueTrendError },
    { data: topProduct, error: topProductError },
    { data: ratings, error: ratingsError },
    { count: totalCustomers, error: totalCustomersError },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "pending"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "delivered"),
    supabase.from("orders").select("total_amount"),
    supabase.rpc("get_weekly_revenue"),
    supabase
      .from("order_items")
      .select("product_name, quantity"),
    supabase.from("reviews").select("rating"),
    supabase.from("users").select("*", { count: "exact", head: true }),
  ]);

  if (totalOrdersError) throw totalOrdersError;
  if (pendingOrdersError) throw pendingOrdersError;
  if (completedOrdersError) throw completedOrdersError;
  if (revenueRowsError) throw revenueRowsError;
  if (revenueTrendError) throw revenueTrendError;
  if (topProductError) throw topProductError;
  if (ratingsError) throw ratingsError;
  if (totalCustomersError) throw totalCustomersError;

  const totalRevenue =
    revenueRows?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;

  const avgRating =
    (ratings?.reduce((sum, r) => sum + r.rating, 0) || 0) /
    (ratings?.length || 1) || 0;

  // Aggregate total quantity per product to find the top product
  const productTotals = {};
  (topProduct || []).forEach((item) => {
    const name = item.product_name || "Unknown";
    productTotals[name] = (productTotals[name] || 0) + (item.quantity || 0);
  });
  const topProductName =
    Object.keys(productTotals).length > 0
      ? Object.entries(productTotals).sort((a, b) => b[1] - a[1])[0][0]
      : "N/A";

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    totalCustomers,
    revenueTrend,
    topProduct: topProductName,
    avgRating: avgRating.toFixed(1),
  };
};
