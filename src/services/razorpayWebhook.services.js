import { finalizeSuccessfulPayment } from "./paymentVerify.services.js";
import crypto from "crypto";
import supabase from "../config/supabase.js";

export const processRazorpayWebhook = async ({ headers, rawBody }) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = headers["x-razorpay-signature"];

  // Use raw body buffer for signature verification
  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (signature !== expectedSignature) {
    throw new Error("Invalid webhook signature");
  }

  // Parse JSON from raw body
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    throw new Error("Invalid webhook payload");
  }

  const event = body.event;
  const payload = body.payload?.payment?.entity || body.payload?.order?.entity;
  if (!event || !payload) {
    throw new Error("Invalid webhook payload");
  }

  if (event === "payment.captured") {
    // Find order by razorpay_order_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, order_status, payment_method")
      .eq("razorpay_order_id", payload.order_id)
      .single();
    if (orderError || !order) throw new Error("Order not found");
    if (order.payment_method !== "razorpay") return { message: "Not a Razorpay order" };
    if (order.payment_status === "success") return { success: true };
    // Call shared finalization logic (idempotent)
    await finalizeSuccessfulPayment({
      orderId: order.id,
      razorpay_payment_id: payload.id,
    });
    return { success: true };
  } else if (event === "payment.failed") {
    // Find order by razorpay_order_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, order_status, payment_method")
      .eq("razorpay_order_id", payload.order_id)
      .single();
    if (orderError || !order) throw new Error("Order not found");
    if (order.payment_method !== "razorpay") return { message: "Not a Razorpay order" };
    if (order.payment_status === "failed") return { success: true };
    // Mark as failed/cancelled
    await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        order_status: "cancelled",
      })
      .eq("id", order.id);
    return { success: true };
  } else {
    return { message: "Event ignored" };
  }
};
