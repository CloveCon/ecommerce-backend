import { getAdminOrders } from "../services/orders.services.js";

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
