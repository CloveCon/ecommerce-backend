import {
  getProducts,
  getProductStats,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/products.services.js";

export const fetchProducts = async (req, res) => {
  try {
    const data = await getProducts(req.query);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const fetchProductStats = async (req, res) => {
  try {
    const stats = await getProductStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        error: "Name and price are required",
      });
    }

    const product = await createProduct(req.body);
    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const editProduct = async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, req.body);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeProduct = async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
