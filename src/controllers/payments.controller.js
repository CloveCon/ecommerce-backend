import {
  createPayment as createPaymentService,
  updatePaymentStatus as updatePaymentStatusService,
  getPayments,
} from "../services/payments.services.js";

export const createPayment = async (req, res) => {
  try {
    const payment = await createPaymentService(req.body);
    res.status(201).json({
      message: "Payment initiated",
      payment,
    });
  } catch (error) {
    if (error.message === "order_id, amount and payment_method are required") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await updatePaymentStatusService({
      id: req.params.id,
      status: req.body.status,
      transaction_id: req.body.transaction_id,
    });

    res.json({
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    if (error.message === "Invalid payment status") {
      return res.status(400).json({ error: error.message });
    }

    if (error.message === "Payment not found") {
      return res.status(404).json({ error: error.message });
    }

    console.error("PAYMENT UPDATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchPayments = async (req, res) => {
  try {
    const data = await getPayments();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
