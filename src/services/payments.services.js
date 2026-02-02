import supabase from "../config/supabase.js";

/**
 * CREATE PAYMENT
 */
export const createPayment = async ({ order_id, amount, payment_method }) => {
  if (!order_id || !amount || !payment_method) {
    throw new Error("order_id, amount and payment_method are required");
  }

  const { data, error } = await supabase
    .from("payments")
    .insert([
      {
        order_id,
        amount,
        payment_method,
        payment_status: "pending",
      },
    ])
    .select();

  if (error) throw error;

  return data[0];
};

/**
 * UPDATE PAYMENT STATUS (customer flow)
 */
export const updatePaymentStatus = async ({ id, status, transaction_id }) => {
  const allowedStatuses = ["pending", "success", "failed"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid payment status");
  }

  const updateData = { payment_status: status };

  if (status === "success") {
    updateData.transaction_id = transaction_id;
  }

  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .update(updateData)
    .eq("id", id)
    .select();

  if (paymentError) throw paymentError;
  if (!paymentData.length) throw new Error("Payment not found");

  const payment = paymentData[0];

  // Sync order status
  if (status === "success") {
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        order_status: "confirmed",
        payment_status: "success",
      })
      .eq("id", payment.order_id);

    if (orderError) throw orderError;
  } else {
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: status,
      })
      .eq("id", payment.order_id);

    if (orderError) throw orderError;
  }

  return payment;
};

/**
 * GET PAYMENTS (customer view)
 */
export const getPayments = async () => {
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      "id, amount, payment_status, payment_method, transaction_id, created_at, order_id"
    )
    .order("created_at", { ascending: false });

  if (paymentsError) throw paymentsError;

  const orderIds = [...new Set(payments.map(p => p.order_id).filter(Boolean))];

  let ordersById = {};
  if (orderIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_status, user_id")
      .in("id", orderIds);

    if (ordersError) throw ordersError;

    ordersById = Object.fromEntries(orders.map(order => [order.id, order]));
  }

  const userIds = [...new Set(
    Object.values(ordersById)
      .map(order => order.user_id)
      .filter(Boolean)
  )];

  let usersById = {};
  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);

    if (usersError) throw usersError;

    usersById = Object.fromEntries(users.map(user => [user.id, user]));
  }

  return payments.map(payment => {
    const order = payment.order_id ? ordersById[payment.order_id] : null;
    const user = order?.user_id ? usersById[order.user_id] : null;

    return {
      id: payment.id,
      amount: payment.amount,
      payment_status: payment.payment_status,
      payment_method: payment.payment_method,
      payment_mode: payment.payment_method,
      paymentMethod: payment.payment_method,
      method: payment.payment_method,
      transaction_id: payment.transaction_id,
      created_at: payment.created_at,
      customer_name: user?.name || "Guest",
      customer_email: user?.email || "N/A",
      order_id: payment.order_id,
      order_status: order?.order_status
    };
  });
};

/**
 * GET ALL PAYMENTS + STATS (admin)
 */
export const getPaymentsWithStats = async () => {
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      "id, amount, payment_status, payment_method, transaction_id, created_at, order_id"
    )
    .order("created_at", { ascending: false });

  if (paymentsError) throw paymentsError;

  const orderIds = [...new Set(payments.map(p => p.order_id).filter(Boolean))];

  let ordersById = {};
  if (orderIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_status, user_id")
      .in("id", orderIds);

    if (ordersError) throw ordersError;

    ordersById = Object.fromEntries(orders.map(order => [order.id, order]));
  }

  const userIds = [...new Set(
    Object.values(ordersById)
      .map(order => order.user_id)
      .filter(Boolean)
  )];

  let usersById = {};
  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);

    if (usersError) throw usersError;

    usersById = Object.fromEntries(users.map(user => [user.id, user]));
  }

  // Normalize response to include customer name and payment method
  const normalizedPayments = payments.map(payment => {
    const order = payment.order_id ? ordersById[payment.order_id] : null;
    const user = order?.user_id ? usersById[order.user_id] : null;

    return {
      id: payment.id,
      amount: payment.amount,
      payment_status: payment.payment_status,
      payment_method: payment.payment_method,
      payment_mode: payment.payment_method,
      paymentMethod: payment.payment_method,
      method: payment.payment_method,
      transaction_id: payment.transaction_id,
      created_at: payment.created_at,
      customer_name: user?.name || "Guest",
      customer_email: user?.email || "N/A",
      order_id: payment.order_id,
      order_status: order?.order_status
    };
  });

  const totalRevenue = normalizedPayments
    .filter(p => p.payment_status === "success")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const refunds = normalizedPayments
    .filter(p => p.payment_status === "refunded")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pending = normalizedPayments
    .filter(p => p.payment_status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    payments: normalizedPayments,
    stats: {
      totalRevenue,
      refunds,
      pending,
      totalCount: normalizedPayments.length,
    },
  };
};

/**
 * UPDATE PAYMENT STATUS (admin)
 */
export const updatePaymentStatusAdmin = async ({ id, status }) => {
  const allowed = ["paid", "pending", "failed", "refunded"];

  if (!allowed.includes(status)) {
    throw new Error("Invalid status");
  }

  const { data, error } = await supabase
    .from("payments")
    .update({ payment_status: status })
    .eq("id", id)
    .select();

  if (error) throw error;

  return data[0];
};
