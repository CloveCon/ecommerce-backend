import supabase, { supabaseAdmin } from "../config/supabase.js";

/**
 * Find or create a guest user for walk-in orders.
 * If phone is provided, looks up by phone first.
 */
const findOrCreateGuestUser = async ({ name, phone }) => {
    // Try to find existing user by phone
    if (phone) {
        const { data: matches, error: lookupError } = await supabaseAdmin
            .from("users")
            .select("id, name")
            .eq("phone", phone)
            .limit(1);

        if (!lookupError && matches && matches.length > 0) {
            return matches[0];
        }
    }

    // Create a new guest user
    const guestName = name || "Walk-In Guest";
    const guestEmail = `walkin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@guest.local`;

    const { data: newUser, error } = await supabaseAdmin
        .from("users")
        .insert([
            {
                name: guestName,
                email: guestEmail,
                phone: phone || null,
                password_hash: "WALK_IN_GUEST",
                is_active: true,
            },
        ])
        .select("id, name")
        .single();

    if (error) {
        console.error("GUEST USER CREATE ERROR:", error);
        throw error;
    }
    return newUser;
};

/**
 * CREATE WALK-IN ORDER
 */
export const createWalkInOrder = async ({
    items,
    order_type = "walk_in",
    table_number,
    customer_name,
    customer_phone,
    payment_method,
    discount = 0,
    notes,
    created_by,
}) => {
    if (!items || items.length === 0) {
        throw new Error("Order items required");
    }

    if (!payment_method || !["cash", "card", "upi"].includes(payment_method)) {
        throw new Error(
            "Invalid or missing payment_method. Must be cash, card, or upi"
        );
    }

    // Find or create user
    console.log("[walk-in] Finding or creating guest user...");
    const user = await findOrCreateGuestUser({
        name: customer_name,
        phone: customer_phone,
    });
    console.log("[walk-in] User:", user.id, user.name);

    // Validate products and calculate total
    let subtotal = 0;
    for (const item of items) {
        const { data: product, error: productError } = await supabase
            .from("products")
            .select("stock, name, price, is_available, is_active")
            .eq("id", item.product_id)
            .single();

        if (productError) {
            console.error("[walk-in] Product lookup error:", productError);
            throw productError;
        }
        if (!product) {
            throw new Error(`Product with ID ${item.product_id} not found`);
        }
        if (!product.is_available || !product.is_active) {
            throw new Error(`${product.name} is currently unavailable`);
        }
        if (product.stock < item.quantity) {
            throw new Error(
                `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
            );
        }

        subtotal += product.price * item.quantity;
        item.price_at_purchase = product.price;
        item.product_name = product.name;
    }

    const discountAmount = Math.min(discount, subtotal);
    const totalAmount = subtotal - discountAmount;

    // Build order payload - only include fields that exist in the table
    const orderPayload = {
        user_id: user.id,
        total_amount: totalAmount,
        order_status: "confirmed",
        payment_status: "pending",
        payment_method: payment_method,
    };

    // Add optional fields only if not null (to avoid NOT NULL constraint issues)
    if (order_type) orderPayload.order_type = order_type;
    if (table_number) orderPayload.table_number = table_number;
    if (customer_name) orderPayload.customer_name = customer_name;
    if (customer_phone) orderPayload.customer_phone = customer_phone;

    console.log("[walk-in] Order payload:", JSON.stringify(orderPayload));

    // Insert order
    const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert([orderPayload])
        .select()
        .single();

    if (orderError) {
        console.error("[walk-in] ORDER INSERT ERROR:", orderError);
        throw orderError;
    }

    console.log("[walk-in] Order created:", order.id);

    // Insert order items
    const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
    }));

    const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItems);

    if (itemsError) {
        console.error("[walk-in] ORDER ITEMS INSERT ERROR:", itemsError);
        throw itemsError;
    }

    // Reduce stock
    for (const item of items) {
        const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();

        if (product) {
            const newStock = product.stock - item.quantity;
            await supabaseAdmin
                .from("products")
                .update({ stock: newStock })
                .eq("id", item.product_id);
        }
    }

    // Insert payment record
    const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert([
            {
                order_id: order.id,
                amount: totalAmount,
                payment_method: payment_method,
                payment_status: "pending",
                transaction_id: null,
            },
        ]);

    if (paymentError) {
        console.error("[walk-in] PAYMENT INSERT ERROR:", paymentError);
        // Don't throw here - order is already created
    }

    return {
        ...order,
        orderItems,
        customer_name: customer_name || user.name,
        subtotal,
        discount: discountAmount,
    };
};

/**
 * GET ACTIVE WALK-IN ORDERS (today's)
 */
export const getActiveWalkInOrders = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
        .from("orders")
        .select(
            `
      id,
      total_amount,
      order_status,
      payment_status,
      payment_method,
      order_type,
      table_number,
      customer_name,
      customer_phone,
      created_at,
      order_items (
        product_name,
        quantity,
        price_at_purchase
      )
    `
        )
        .eq("order_type", "walk_in")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * UPDATE WALK-IN ORDER STATUS
 */
export const updateWalkInOrderStatus = async (orderId, status) => {
    const validStatuses = [
        "pending",
        "confirmed",
        "dispatched",
        "delivered",
        "cancelled",
    ];

    if (!validStatuses.includes(status)) {
        throw new Error("Invalid walk-in order status");
    }

    // Auto-update payment_status based on order status
    const updatePayload = { order_status: status };
    if (status === "delivered") {
        updatePayload.payment_status = "success";
    }

    const { data, error } = await supabaseAdmin
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
        .eq("order_type", "walk_in")
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error("Walk-in order not found");

    // Also update the payments table
    if (status === "delivered") {
        await supabaseAdmin
            .from("payments")
            .update({ payment_status: "success" })
            .eq("order_id", orderId);
    }

    return data;
};
