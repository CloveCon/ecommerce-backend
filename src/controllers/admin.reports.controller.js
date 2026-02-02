import { getReports } from "../services/reports.services.js";

export const fetchReports = async (req, res) => {
  try {
    const reports = await getReports();
    res.json(reports);
  } catch (err) {
    console.error("REPORTS ERROR:", err);
    res.status(500).json({ error: "Failed to load reports" });
  }
};
