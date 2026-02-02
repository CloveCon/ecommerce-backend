import { getReviews, createReview } from "../services/reviews.services.js";

export const fetchReviews = async (req, res) => {
  try {
    const reviews = await getReviews();
    res.json(reviews);
  } catch (err) {
    console.error("REVIEWS FETCH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

export const addReview = async (req, res) => {
  try {
    const review = await createReview(req.body);
    res.json({
      message: "Review added successfully",
      review,
    });
  } catch (err) {
    if (err.message === "Missing required fields") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: err.message });
  }
};
