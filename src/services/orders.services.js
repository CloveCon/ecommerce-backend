import supabase, { supabaseAdmin } from "../config/supabase.js";

// GET order by ID with items
export const getOrderById = async (orderId) => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      total_amount,
      order_status,
      payment_status,
      payment_method,
      paid_at,
      created_at,
      razorpay_order_id,
      razorpay_payment_id,
      order_items (
        product_id,
        product_name,
        quantity,
        price
      )
    `)
    .eq("id", orderId)
    .single();
  if (error) return null;
  return data;
};

const parseCoordinate = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} missing or invalid`);
  }
  return parsed;
};

const getOpenRouteServiceApiKey = () => {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouteService API key missing");
  }

  return apiKey;
};

const getRestaurantLocation = () => {
  const latitude = parseCoordinate(process.env.RESTAURANT_LATITUDE, "Restaurant latitude");
  const longitude = parseCoordinate(process.env.RESTAURANT_LONGITUDE, "Restaurant longitude");

  return { latitude, longitude };
};

const chunkArray = (items, size) => {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

const getOrderDeliveryCoordinates = async ({ userId, addressId }) => {
  if (!addressId) {
    throw new Error("Order address missing");
  }

  const { data, error } = await supabaseAdmin
    .from("user_addresses")
    .select("latitude, longitude")
    .eq("id", addressId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  if (!data) {
    throw new Error("Order address not found");
  }

  const { latitude, longitude } = data;

  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    throw new Error("Order address coordinates missing");
  }

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
};

const getAddressCoordinatesByIds = async (addressIds) => {
  if (!addressIds || addressIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabaseAdmin
    .from("user_addresses")
    .select("id, latitude, longitude")
    .in("id", addressIds);

  if (error) throw error;

  const map = new Map();
  (data || []).forEach((address) => {
    map.set(address.id, {
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
    });
  });

  return map;
};

const fetchEtaDurations = async ({ restaurant, destinations }) => {
  if (!destinations || destinations.length === 0) {
    return [];
  }

  const apiKey = getOpenRouteServiceApiKey();
  const response = await fetch(
    "https://api.openrouteservice.org/v2/matrix/driving-car",
    {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locations: [
          [restaurant.longitude, restaurant.latitude],
          ...destinations.map((destination) => [destination.longitude, destination.latitude]),
        ],
        metrics: ["duration"],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouteService error: ${response.status} ${response.statusText} ${errorText}`
    );
  }

  const payload = await response.json();
  const durations = payload?.durations?.[0]?.slice(1) || [];

  return durations;
};

/**
 * CREATE ORDER
 */
export const createOrder = async ({ items, user_id, address_id, payment_method }) => {
  try {
    if (!items || items.length === 0) {
      throw new Error("Order items required");
    }
    if (!user_id) {
      throw new Error("User ID required");
    }
    if (!address_id) {
      throw new Error("Address ID required");
    }
    if (!payment_method || !["cod", "razorpay"].includes(payment_method)) {
      throw new Error("Invalid or missing payment_method");
    }

    // Recalculate total from DB
    let total = 0;
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock, name, price")
        .eq("id", item.product_id)
        .single();
      if (productError) throw productError;
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
      total += product.price * item.quantity;
      item.price_at_purchase = product.price; // Use price_at_purchase for DB
      item.product_name = product.name;
    }

    let order_status, payment_status, razorpay_order_id = null;
    if (payment_method === "cod") {
      order_status = "confirmed";
      payment_status = "pending";
    } else if (payment_method === "razorpay") {
      order_status = "pending";
      payment_status = "pending";
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id,
          address_id,
          total_amount: total,
          order_status,
          payment_status,
          payment_method,
        },
      ])
      .select()
      .single();
    if (orderError) throw orderError;

    // Insert order_items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
    }));
    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);
    if (orderItemsError) throw orderItemsError;

    // COD: Reduce stock immediately
    if (payment_method === "cod") {
      for (const item of items) {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();
        if (productError) throw productError;
        const newStock = product.stock - item.quantity;
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.product_id);
        if (updateError) throw updateError;
      }
      // Insert payment record for COD
      const { error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            order_id: order.id,
            amount: order.total_amount,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            transaction_id: null,
          },
        ]);
      if (paymentError) throw paymentError;
      return { ...order, orderItems };
    }

    // Razorpay: Create Razorpay order, do NOT reduce stock
    if (payment_method === "razorpay") {
      const { createRazorpayOrder } = await import("../services/razorpay.services.js");
      // Ensure receipt is always <= 40 chars (Razorpay limit)
      const shortReceipt = `o_${order.id.slice(0, 38)}`; // 2 + 38 = 40
      const amount = Math.round(total * 100);
      if (typeof amount !== 'number' || isNaN(amount)) {
        throw new Error('Razorpay order amount is undefined or invalid');
      }
      let razorpayOrder;
      try {
        razorpayOrder = await createRazorpayOrder({ amount, currency: "INR", receipt: shortReceipt });
      } catch (err) {
        // Print as much info as possible, always log
        console.error('RAZORPAY CREATE ERROR:', err);
        if (err && err.response && err.response.body) {
          console.error('RAZORPAY ERROR RESPONSE BODY:', err.response.body);
        }
        if (err && err.stack) {
          console.error('RAZORPAY ERROR STACK:', err.stack);
        }
        throw new Error('Failed to create Razorpay order. Please try again.');
      }
      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error('Failed to create Razorpay order. Please try again.');
      }
      razorpay_order_id = razorpayOrder.id;
      // Save razorpay_order_id
      await supabase
        .from("orders")
        .update({ razorpay_order_id })
        .eq("id", order.id);
      // Insert payment record for Razorpay
      const { error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            order_id: order.id,
            amount: order.total_amount,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            transaction_id: razorpayOrder.id,
          },
        ]);
      if (paymentError) throw paymentError;
      // Return a consistent object for frontend
      return {
        ...order,
        orderItems,
        razorpay: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      };
    }
    return { ...order, orderItems };
  } catch (err) {
    console.error("CREATE ORDER SERVICE ERROR:", err);
    throw err;
  }

  if (!user_id) {
    throw new Error("User ID required");
  }

  if (!address_id) {
    throw new Error("Address ID required");
  }

  // Debug: log received items
  console.log("[createOrder] Order items received:", JSON.stringify(items, null, 2));
  items.forEach((item, idx) => {
    console.log(`[createOrder] Item #${idx + 1} - product_id: ${item.product_id}, quantity: ${item.quantity}, price: ${item.price}, product_name: ${item.product_name}`);
  });
  // Validate stock availability BEFORE creating order
  for (const item of items) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock, name, price")
      .eq("id", item.product_id)
      .single();
    if (productError) throw productError;
    if (!product) {
      throw new Error(`Product with ID ${item.product_id} not found`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
    }
    total += product.price * item.quantity;
    item.price_at_purchase = product.price;
    item.product_name = product.name;
  }

  const total = items.reduce(
    (sum, item) => sum + (typeof item.price === 'number' ? item.price : 0) * item.quantity,
    0
  );
  console.log("[createOrder] Calculated total_amount:", total);

  const orderPayload = {
    user_id,
    address_id,
    total_amount: total,
    order_status: "pending",
  };
  console.log("[createOrder] Order payload to insert:", JSON.stringify(orderPayload, null, 2));
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([orderPayload])
    .select()
    .single();
  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price_at_purchase: item.price,
  }));
  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);
  if (orderItemsError) throw orderItemsError;

  // COD: Reduce stock immediately
  if (payment_method === "cod") {
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();
      if (productError) throw productError;
      const newStock = product.stock - item.quantity;
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product_id);
      if (updateError) throw updateError;
    }
    return { ...order, orderItems };
  }

  // Razorpay: Create Razorpay order, do NOT reduce stock
  if (payment_method === "razorpay") {
    // Create Razorpay order
    const { createRazorpayOrder } = await import("../services/razorpay.services.js");
    // Ensure receipt is always <= 40 chars (Razorpay limit)
    const shortReceipt = `o_${order.id.slice(0, 38)}`; // 2 + 38 = 40
    const amount = Math.round(total * 100);
    console.log('RAZORPAY ORDER DEBUG:', { amount, currency: 'INR', receipt: shortReceipt });
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Razorpay order amount is undefined or invalid');
    }
    let razorpayOrder;
    try {
      console.log('About to call createRazorpayOrder');
      razorpayOrder = await createRazorpayOrder({ amount, currency: "INR", receipt: shortReceipt });
      console.log('Razorpay order created:', razorpayOrder);
    } catch (err) {
      // Print as much info as possible, always log
      console.error('RAZORPAY CREATE ERROR:', err);
      if (err && err.response && err.response.body) {
        console.error('RAZORPAY ERROR RESPONSE BODY:', err.response.body);
      }
      if (err && err.stack) {
        console.error('RAZORPAY ERROR STACK:', err.stack);
      }
      throw new Error('Failed to create Razorpay order. Please try again.');
    }
    if (!razorpayOrder || !razorpayOrder.id) {
      throw new Error('Failed to create Razorpay order. Please try again.');
    }
    razorpay_order_id = razorpayOrder.id;
    // Save razorpay_order_id
    await supabase
      .from("orders")
      .update({ razorpay_order_id })
      .eq("id", order.id);
    // Return a consistent object for frontend
    return {
      ...order,
      orderItems,
      razorpay: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    };
  }
  return { ...order, orderItems };
};

/**
 * GET ALL ORDERS
 */
export const getOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      order_status,
      payment_status,
      created_at,
      order_items (
        product_id,
        quantity,
        price_at_purchasew
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

/**
 * GET ORDERS BY USER ID (profile)
 */
export const getOrdersByUserId = async (userId) => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      order_status,
      payment_status,
      created_at,
      order_items (
        product_id,
        product_name,
        quantity,
        price_at_purchase
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * UPDATE ORDER STATUS
 */
export const updateOrderStatus = async (id, status) => {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "dispatched",
    "delivered",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid order status");
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("id", id)
    .select();

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("Order not found");
  }

  return data[0];
};

/**
 * GET ORDER ETA
 */
export const getOrderEta = async ({ orderId, requesterUserId }) => {
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, user_id, order_status, address_id")
    .eq("id", orderId)
    .single();

  if (error) throw error;
  if (!order) throw new Error("Order not found");

  if (requesterUserId && order.user_id !== requesterUserId) {
    throw new Error("Forbidden");
  }

  if (order.order_status !== "dispatched") {
    throw new Error("Order not dispatched");
  }

  const restaurant = getRestaurantLocation();
  const customer = await getOrderDeliveryCoordinates({
    userId: order.user_id,
    addressId: order.address_id,
  });

  const durations = await fetchEtaDurations({
    restaurant,
    destinations: [customer],
  });
  const durationSeconds = durations[0];

  if (!Number.isFinite(durationSeconds)) {
    throw new Error("ETA unavailable");
  }

  return {
    order_id: order.id,
    status: order.order_status,
    eta_seconds: Math.round(durationSeconds),
    eta_minutes: Math.max(1, Math.round(durationSeconds / 60)),
  };
};

/**
 * GET ETA LIST
 */
export const getOrdersEtaList = async ({ userId } = {}) => {
  let query = supabase
    .from("orders")
    .select("id, user_id, order_status, address_id")
    .eq("order_status", "dispatched")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: orders, error } = await query;

  if (error) throw error;

  const addressIds = Array.from(
    new Set(
      (orders || [])
        .filter((order) => order.address_id)
        .map((order) => order.address_id)
    )
  );

  const addressMap = await getAddressCoordinatesByIds(addressIds);
  const restaurant = getRestaurantLocation();

  const etaResults = (orders || []).map((order) => ({
    order_id: order.id,
    status: order.order_status,
    address_id: order.address_id || null,
    eta_seconds: null,
    eta_minutes: null,
    eta_message: null,
  }));

  const validOrders = etaResults
    .map((result, index) => ({ result, order: orders[index] }))
    .filter(({ order, result }) => {
      if (order.order_status !== "dispatched") {
        result.eta_message = "Yet to be dispatched";
        return false;
      }

      if (!order.address_id) {
        result.eta_message = "Order address missing";
        return false;
      }

      const address = addressMap.get(order.address_id);
      if (!address) {
        result.eta_message = "Order address not found";
        return false;
      }

      if (
        !Number.isFinite(address.latitude) ||
        !Number.isFinite(address.longitude)
      ) {
        result.eta_message = "Order address coordinates missing";
        return false;
      }

      return true;
    })
    .map(({ order, result }) => ({
      order,
      result,
      destination: addressMap.get(order.address_id),
    }));

  const batches = chunkArray(validOrders, 50);

  for (const batch of batches) {
    const destinations = batch.map((item) => item.destination);
    const durations = await fetchEtaDurations({ restaurant, destinations });

    batch.forEach((item, index) => {
      const durationSeconds = durations[index];
      if (!Number.isFinite(durationSeconds)) {
        item.result.eta_message = "ETA unavailable";
        return;
      }

      item.result.eta_seconds = Math.round(durationSeconds);
      item.result.eta_minutes = Math.max(1, Math.round(durationSeconds / 60));
    });
  }

  return etaResults;
};

/**
 * ASSIGN RIDER TO ORDER
 */
export const assignOrderRider = async ({ orderId, riderId }) => {
  const { data: rider, error: riderError } = await supabaseAdmin
    .from("admins")
    .select("id, role, is_active")
    .eq("id", riderId)
    .single();

  if (riderError) throw riderError;
  if (!rider) throw new Error("Rider not found");
  if (rider.role !== "rider") throw new Error("Admin is not a rider");
  if (rider.is_active === false) throw new Error("Rider is inactive");

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ rider_id: riderId, order_status: "dispatched" })
    .eq("id", orderId)
    .select("id, rider_id, order_status")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Order not found");

  return data;
};

/**
 * GET ORDERS (SEARCH + FILTER + PAGINATION)
 */
export const getAdminOrders = async ({
  page = 1,
  limit = 10,
  search,
  status,
  from,
  to,
}) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("orders")
    .select(
      `
      id,
      total_amount,
      order_status,
      created_at,

      users (
        id,
        name
      ),

      order_items (
        quantity,
        product_name,
        price_at_purchase
      )
    `,
      { count: "exact" }
    );

  if (search) {
    query = query.eq("id", search);
  }

  if (status) {
    query = query.eq("order_status", status);
  }

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    page,
    limit,
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    data,
  };
};