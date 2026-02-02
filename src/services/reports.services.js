import supabase from "../config/supabase.js";

export const getReports = async () => {
  /** ---------------- TOTAL SALES ---------------- */
  const { data: paidPayments, error: paymentError } = await supabase
    .from("payments")
    .select("amount, created_at")
    .eq("payment_status", "success");

  if (paymentError) throw paymentError;

  const totalSales =
    paidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  /** ---------------- DAILY SALES (LAST 7 DAYS) ---------------- */
  const salesMap = {};

  paidPayments?.forEach((p) => {
    const date = new Date(p.created_at).toISOString().split("T")[0];
    salesMap[date] = (salesMap[date] || 0) + Number(p.amount);
  });

  const dailySales = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    return {
      date: key,
      amount: salesMap[key] || 0,
    };
  });

  /** ---------------- AVERAGE ORDER VALUE ---------------- */
  const { data: deliveredOrders, error: deliveredOrdersError } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("order_status", "delivered");

  if (deliveredOrdersError) throw deliveredOrdersError;

  const avgOrderValue =
    deliveredOrders?.length
      ? Math.round(
          deliveredOrders.reduce(
            (sum, o) => sum + Number(o.total_amount),
            0
          ) / deliveredOrders.length
        )
      : 0;

  /** ---------------- ORDERS TODAY ---------------- */
  const today = new Date().toISOString().split("T")[0];

  const { count: ordersToday, error: ordersTodayError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  if (ordersTodayError) throw ordersTodayError;

  /** ---------------- CONVERSION RATE ---------------- */
  const { count: totalOrders, error: totalOrdersError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  if (totalOrdersError) throw totalOrdersError;

  const conversionRate =
    totalOrders > 0
      ? Math.round((deliveredOrders.length / totalOrders) * 100)
      : 0;

  /** ---------------- TOP PRODUCTS ---------------- */
  const { data: orderItems, error: orderItemsError } = await supabase
    .from("order_items")
    .select("product_name");

  if (orderItemsError) throw orderItemsError;

  const productCount = {};

  orderItems?.forEach((i) => {
    productCount[i.product_name] = (productCount[i.product_name] || 0) + 1;
  });

  const topProducts = Object.entries(productCount)
    .map(([name, orders]) => ({ name, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("rating");

  if (reviewsError) throw reviewsError;

  const avgRating =
    reviews?.length
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating), 0) /
          reviews.length
        ).toFixed(1)
      : 0;
      
  const { count: deliveredCount, error: deliveredCountError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("order_status", "delivered");

  if (deliveredCountError) throw deliveredCountError;

  const deliveryRate =
    totalOrders > 0
      ? Math.round((deliveredCount / totalOrders) * 100)
      : 0;

  return {
    totalSales,
    avgOrderValue,
    ordersToday,
    conversionRate,
    dailySales,
    topProducts,
    avgRating,
    deliveryRate,
  };
};
