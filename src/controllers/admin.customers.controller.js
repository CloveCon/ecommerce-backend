import { getCustomers } from "../services/customers.services.js";

export const fetchCustomers = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getCustomers({ search, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};
