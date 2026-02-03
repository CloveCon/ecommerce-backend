import supabase, { supabaseAdmin } from "../config/supabase.js";

/**
 * UPLOAD PRODUCT IMAGE
 */
export const uploadProductImage = async (file) => {
  const fileExt = file.originalname.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  // Use admin client to bypass RLS policies
  const { data, error } = await supabaseAdmin.storage
    .from("product-images")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw error;

  // Get public URL
  const { data: publicData } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return publicData.publicUrl;
};

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

/**
 * SEARCH PRODUCTS BY QUERY
 * Searches in name, description, and category name
 */
export const searchProductsByQuery = async (query) => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      image_url,
      stock,
      category_id,
      categories (
        name
      )
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("name", { ascending: true });

  if (error) throw error;

  // Format response to include category name at top level
  return data.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image_url: product.image_url,
    stock: product.stock,
    category: product.categories?.name || "Uncategorized",
    slug: product.name.toLowerCase().replace(/\s+/g, "-"),
  }));
};

/**
 * GET TRENDING PRODUCTS
 * Based on most sold (using order_items table)
 */
export const getTrendingProducts = async (limit = 6) => {
  // First, get products with their total sales count
  const { data, error } = await supabase
    .from("order_items")
    .select(`
      product_id,
      quantity,
      products (
        id,
        name,
        price,
        image_url,
        stock,
        categories (
          name
        )
      )
    `);

  if (error) {
    console.error("Error fetching trending products:", error);
    // Fallback: return latest products if order_items query fails
    return await getLatestProducts(limit);
  }

  // Aggregate sales by product
  const salesByProduct = {};
  data.forEach(item => {
    if (item.products) {
      const productId = item.products.id;
      if (!salesByProduct[productId]) {
        salesByProduct[productId] = {
          product: item.products,
          totalSold: 0,
        };
      }
      salesByProduct[productId].totalSold += item.quantity;
    }
  });

  // Sort by total sold and get top products
  const trending = Object.values(salesByProduct)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, limit)
    .map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image_url: item.product.image_url,
      stock: item.product.stock,
      category: item.product.categories?.name || "Uncategorized",
      slug: item.product.name.toLowerCase().replace(/\s+/g, "-"),
      totalSold: item.totalSold,
    }));

  // If no trending products, fallback to latest
  if (trending.length === 0) {
    return await getLatestProducts(limit);
  }

  return trending;
};

/**
 * GET LATEST PRODUCTS (Fallback)
 */
const getLatestProducts = async (limit = 6) => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      image_url,
      stock,
      categories (
        name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    stock: product.stock,
    category: product.categories?.name || "Uncategorized",
    slug: product.name.toLowerCase().replace(/\s+/g, "-"),
  }));
};
