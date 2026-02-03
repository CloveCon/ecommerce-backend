import { getReviewsByProductId } from "../services/reviews.services.js";

export const fetchReviewsByProduct = async (req, res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const reviews = await getReviewsByProductId(product_id);
    res.json({ data: reviews });
  } catch (err) {
    console.error("REVIEWS FETCH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};
