import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

/* GET all categories */
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
});

/* CREATE category */
router.post("/", async (req, res) => {
  const { name } = req.body;

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name }]);

  if (error) return res.status(500).json(error);

  res.json({ message: "Category created", data });
});

/* UPDATE category */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;

  const { data, error } = await supabase
    .from("categories")
    .update({ name, is_active })
    .eq("id", id);

  if (error) return res.status(500).json(error);

  res.json({ message: "Category updated", data });
});

/* DELETE category */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json(error);

  res.json({ message: "Category deleted" });
});

export default router;
