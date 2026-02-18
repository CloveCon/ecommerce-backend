import { addProductReview, fetchProductReviews } from "../services/product.reviews.services.js";

export const createProductReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { rating, comment, order_item_id } = req.body;
    const review = await addProductReview({ userId, productId, rating, comment, order_item_id });
    res.status(201).json({ message: "Review created", review });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await fetchProductReviews(productId);
    res.json({ data: reviews });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};
