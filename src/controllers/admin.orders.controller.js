import {
  getAdminOrders,
  getOrderEta,
  getOrdersEtaList,
} from "../services/orders.services.js";

export const fetchAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getAdminOrders({
      page,
      limit,
      search: req.query.search,
      status: req.query.status,
      from: req.query.from,
      to: req.query.to,
    });

    res.json(result);
  } catch (err) {
    console.error("ORDERS FETCH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const fetchAdminOrderEta = async (req, res) => {
  try {
    const result = await getOrderEta({ orderId: req.params.id });
    return res.json(result);
  } catch (err) {
    if (err.message === "Order not found") {
      return res.status(404).json({ error: err.message });
    }

    if (
      err.message === "Order not dispatched" ||
      err.message === "Order address missing" ||
      err.message === "Order address not found" ||
      err.message === "Order address coordinates missing"
    ) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to fetch ETA" });
  }
};

export const fetchAdminOrdersEtaList = async (req, res) => {
  try {
    const data = await getOrdersEtaList();
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch ETA list" });
  }
};
