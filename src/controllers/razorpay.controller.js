import { createRazorpayOrder } from "../services/razorpay.services.js";

export const createOrder = async (req, res) => {
  try {
    let { amount, currency, receipt } = req.body;
    console.log('Razorpay order creation requested. Amount received:', amount);
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }
    // Amount is already in paise from frontend
    const amountPaise = Math.round(Number(amount));
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ error: "Invalid amount value" });
    }
    const order = await createRazorpayOrder({ amount: amountPaise, currency, receipt });
    // Return amount and currency at top level for frontend Razorpay options
    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      order // full order object for debugging
    });
  } catch (err) {
    console.error("Razorpay createOrder error:", err);
    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};
