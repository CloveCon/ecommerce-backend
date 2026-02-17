import { processRazorpayWebhook } from "../services/razorpayWebhook.services.js";

export const razorpayWebhook = async (req, res) => {
  try {
    const result = await processRazorpayWebhook({ headers: req.headers, body: req.body });
    return res.json(result);
  } catch (err) {
    if (err.message === "Invalid webhook signature") {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === "Invalid webhook payload") {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === "Order not found") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Razorpay webhook error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};
