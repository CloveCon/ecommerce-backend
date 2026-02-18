import { verifyRazorpayPaymentService } from "../services/paymentVerify.services.js";

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const result = await verifyRazorpayPaymentService(req.body);
    return res.json(result);
  } catch (err) {
    console.error("Razorpay payment verify error:", err);
    if (err.message === "Missing required fields") {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === "Order not found") {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "Payment verification failed" });
  }
};
