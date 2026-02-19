import { finalizeSuccessfulPayment } from "./paymentVerify.services.js";
import crypto from "crypto";
import supabase from "../config/supabase.js";

export const processRazorpayWebhook = async ({ headers, rawBody }) => {

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = headers["x-razorpay-signature"];
  console.log("[Webhook] Received headers:", headers);
  console.log("[Webhook] Received rawBody:", rawBody);
  // Use raw body buffer for signature verification
  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  console.log("[Webhook] Calculated signature:", expectedSignature);
  if (signature !== expectedSignature) {
    console.error("[Webhook] Invalid signature. Provided:", signature, "Expected:", expectedSignature);
    throw new Error("Invalid webhook signature");
  }

  // Parse JSON from raw body

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    console.error("[Webhook] Failed to parse JSON body:", e);
    throw new Error("Invalid webhook payload");
  }


  const event = body.event;
  const payload = body.payload?.payment?.entity || body.payload?.order?.entity;
  console.log("[Webhook] Event:", event);
  console.log("[Webhook] Payload:", payload);
  if (!event || !payload) {
    console.error("[Webhook] Missing event or payload");
    throw new Error("Invalid webhook payload");
  }

  if (event === "payment.captured") {
    // Find order by razorpay_order_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, order_status, payment_method")
      .eq("razorpay_order_id", payload.order_id)
      .single();
    console.log("[Webhook] Matched order:", order);
    if (orderError || !order) {
      console.error("[Webhook] Order not found for razorpay_order_id:", payload.order_id);
      throw new Error("Order not found");
    }
    if (order.payment_method !== "razorpay") {
      console.log("[Webhook] Not a Razorpay order, skipping.");
      return { message: "Not a Razorpay order" };
    }
    if (order.payment_status === "success") {
      console.log("[Webhook] Order already marked as success.");
      return { success: true };
    }
    // Call shared finalization logic (idempotent)
    await finalizeSuccessfulPayment({
      orderId: order.id,
      razorpay_payment_id: payload.id,
    });
    // Update payment status in payments table
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({ payment_status: "success" })
      .eq("order_id", order.id);
    if (updatePaymentError) {
      console.error("[Webhook] Failed to update payments table:", updatePaymentError);
      throw updatePaymentError;
    }
    console.log("[Webhook] Payment status updated to success for order_id:", order.id);
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
