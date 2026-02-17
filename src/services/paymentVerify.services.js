import crypto from "crypto";
import supabase from "../config/supabase.js";


export const verifyRazorpayPaymentService = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId }) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
    throw new Error("Missing required fields");
  }

  // Fetch order from DB
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, razorpay_order_id, payment_status, order_status, total_amount")
    .eq("id", dbOrderId)
    .single();
  if (orderError || !order) {
    throw new Error("Order not found");
  }

  if (order.razorpay_order_id !== razorpay_order_id) {
    throw new Error("Razorpay order ID mismatch");
  }

  if (order.payment_status === "success") {
    return {
      success: true,
      payment_status: order.payment_status,
      order_status: order.order_status,
    };
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest("hex");

  let payment_status, order_status, paid_at = null;
  let failure_reason = null;
  if (generatedSignature === razorpay_signature) {
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", dbOrderId);
    if (itemsError) throw itemsError;
    try {
      for (const item of orderItems) {
        const { error: rpcError } = await supabase.rpc("reduce_product_stock", {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
        if (rpcError) throw rpcError;
      }
      payment_status = "success";
      order_status = "confirmed";
      paid_at = new Date().toISOString();
    } catch (err) {
      payment_status = "failed";
      order_status = "cancelled";
      failure_reason = err.message || "Stock reduction failed";
    }
  } else {
    payment_status = "failed";
    order_status = "cancelled";
    failure_reason = "Signature mismatch";
  }

  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({
      payment_status,
      order_status,
      paid_at,
      razorpay_payment_id,
      razorpay_signature,
      failure_reason,
    })
    .eq("id", dbOrderId);
  if (updateOrderError) throw updateOrderError;

  return {
    success: payment_status === "success",
    payment_status,
    order_status,
    paid_at,
    failure_reason,
  };
};

// Finalize successful payment (shared by webhook and verify)
export const finalizeSuccessfulPayment = async ({ orderId, razorpay_payment_id }) => {
  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, payment_status, order_status, payment_method")
    .eq("id", orderId)
    .single();
  if (orderError || !order) throw new Error("Order not found");
  if (order.payment_method !== "razorpay") throw new Error("Not a Razorpay order");
  if (order.payment_status === "success") return { success: true };
  // Reduce stock (atomic, via RPC)
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);
  if (itemsError) throw itemsError;
  for (const item of orderItems) {
    const { error: rpcError } = await supabase.rpc("reduce_product_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    if (rpcError) throw rpcError;
  }
  // Update order
  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({
      payment_status: "success",
      order_status: "confirmed",
      paid_at: new Date().toISOString(),
      razorpay_payment_id,
    })
    .eq("id", orderId);
  if (updateOrderError) throw updateOrderError;
  return { success: true };
};
