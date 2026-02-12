import express from "express";
import supabase from "../config/supabase.js";
import { searchProducts, getSuggestions } from "../controllers/products.controller.js";

const router = express.Router();


router.get("/api/products/:slug", async (req, res) => {
  const slug = req.params.slug;

  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("slug", slug);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data || !data.length) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(data[0]);
});

// SEARCH products
router.get("/search", searchProducts);

// GET suggestions/trending products
router.get("/suggestions", getSuggestions);

// GET all products
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// CREATE product
router.post("/", async (req, res) => {
  const { name, description, price, category_id, is_veg, image_url } = req.body;

  // Automatically generate slug from name
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const { data, error } = await supabase
    .from("products")
    .insert([
      { name, description, price, category_id, is_veg, image_url, slug }
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Product created", data });
});

export default router;

// UPDATE product
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, is_veg, image_url } = req.body;

  // Automatically generate slug from name
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const { data, error } = await supabase
    .from("products")
    .update({
      name,
      description,
      price,
      category_id,
      is_veg,
      image_url,
      slug
    })
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    message: "Product updated successfully",
    data,
  });
});

// DELETE product
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Product deleted successfully" });
});