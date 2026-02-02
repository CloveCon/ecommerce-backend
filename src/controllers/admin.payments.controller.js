import {
  getPaymentsWithStats,
  updatePaymentStatusAdmin,
} from "../services/payments.services.js";

export const fetchPaymentsWithStats = async (req, res) => {
  try {
    const data = await getPaymentsWithStats();
    res.json(data);
  } catch (err) {
    console.error("Payments error:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await updatePaymentStatusAdmin({
      id: req.params.id,
      status: req.body.status,
    });

    res.json({ message: "Updated", payment });
  } catch (err) {
    if (err.message === "Invalid status") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: err.message });
  }
};
