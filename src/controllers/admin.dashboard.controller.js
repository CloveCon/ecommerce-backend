import { getDashboardStats } from "../services/dashboard.services.js";

export const fetchDashboardStats = async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Dashboard fetch failed" });
  }
};
