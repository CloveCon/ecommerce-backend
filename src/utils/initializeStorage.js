import { supabaseAdmin } from "../config/supabase.js";

/**
 * Initialize Supabase Storage buckets
 */
export const initializeStorage = async () => {
  try {
    // Check if product-images bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError.message);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === "product-images");

    if (!bucketExists) {
      console.log("Creating product-images bucket...");
      const { data, error } = await supabaseAdmin.storage.createBucket("product-images", {
        public: true,
      });

      if (error) {
        console.error("Error creating bucket:", error.message);
        return;
      }

      console.log("✓ product-images bucket created successfully");
    } else {
      console.log("✓ product-images bucket already exists");
    }
  } catch (err) {
    console.error("Storage initialization error:", err);
  }
};
