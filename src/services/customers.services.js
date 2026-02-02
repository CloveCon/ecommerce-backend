import supabase from "../config/supabase.js";

/**
 * GET CUSTOMERS (SEARCH + PAGINATION)
 */
export const getCustomers = async ({ search = "", page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  const { data: users, count, error: usersError } = await supabase
    .from("users")
    .select("id, name, email, phone, is_active, created_at", {
      count: "exact",
    })
    .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    .range(offset, offset + limit - 1);

  if (usersError) throw usersError;

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("user_id, created_at");

  if (ordersError) throw ordersError;

  const customers = users.map((user) => {
    const userOrders = orders.filter(o => o.user_id === user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      totalOrders: userOrders.length,
      recentOrder:
        userOrders.length > 0
          ? userOrders[userOrders.length - 1].created_at
          : null,
      status: user.is_active ? "Active" : "Inactive",
    };
  });

  return {
    data: customers,
    totalRecords: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};
