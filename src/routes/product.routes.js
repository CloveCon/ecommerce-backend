import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

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

  const { data, error } = await supabase
    .from("products")
    .insert([
      { name, description, price, category_id, is_veg, image_url }
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

  const { data, error } = await supabase
    .from("products")
    .update({
      name,
      description,
      price,
      category_id,
      is_veg,
      image_url
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