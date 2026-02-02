import supabase from "../config/supabase.js";

/**
 * GET PRODUCTS
 */
export const getProducts = async ({ search, stock }) => {
  let query = supabase.from("products").select("*");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (stock === "available") {
    query = query.gt("stock", 10);
  }

  if (stock === "low") {
    query = query.gt("stock", 0).lte("stock", 5);
  }

  if (stock === "out") {
    query = query.eq("stock", 0);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
};

/**
 * PRODUCT STATS
 */
export const getProductStats = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("id, stock");

  if (error) throw error;

  const totalProducts = data.length;
  const outOfStock = data.filter(p => p.stock === 0).length;
  const lowStock = data.filter(p => p.stock > 0 && p.stock <= 5).length;

  return { totalProducts, lowStock, outOfStock };
};

/**
 * CREATE PRODUCT
 */
export const createProduct = async (payload) => {
  const { data, error } = await supabase
    .from("products")
    .insert([payload])
    .select();

  if (error) throw error;
  return data[0];
};

/**
 * UPDATE PRODUCT
 */
export const updateProduct = async (id, payload) => {
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) throw error;
  if (!data.length) throw new Error("Product not found");

  return data[0];
};

/**
 * DELETE PRODUCT
 */
export const deleteProduct = async (id) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
