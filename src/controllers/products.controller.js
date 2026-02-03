import {
  searchProductsByQuery,
  getTrendingProducts,
} from "../services/products.services.js";

/**
 * SEARCH PRODUCTS
 * GET /api/products/search?q=query
 */
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    const products = await searchProductsByQuery(q.trim());
    res.json({
      query: q,
      results: products,
      count: products.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET SUGGESTIONS / TRENDING PRODUCTS
 * GET /api/products/suggestions?limit=6
 */
export const getSuggestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const products = await getTrendingProducts(limit);
    res.json({ data: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
