import {
  createOrder as createOrderService,
  getOrders,
  getOrdersByUserId,
  getOrderEta as getOrderEtaService,
  getOrdersEtaList as getOrdersEtaListService,
  updateOrderStatus as updateOrderStatusService,
  getOrderById,
} from "../services/orders.services.js";
// GET /api/orders/:id (with access control)
export const fetchOrderById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const orderId = req.params.id;
    if (!orderId) return res.status(400).json({ error: "Order ID required" });
    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch order" });
  }
};

export const fetchOrders = async (req, res) => {
  try {
    const data = await getOrders();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const fetchMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await getOrdersByUserId(userId);
    return res.json({ data });
  } catch (err) {
    console.error("FETCH MY ORDERS ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const createOrder = async (req, res) => {
  try {
    // Always use user_id from backend, not frontend
    const order = await createOrderService({
      ...req.body,
      user_id: req.user.id,
    });
    // If order.razorpay exists, return it at the top level for frontend compatibility
    if (order.razorpay) {
      res.json({
        message: "Order created successfully",
        razorpay: order.razorpay,
        order: { ...order, razorpay: undefined },
      });
    } else {
      res.json({
        message: "Order created successfully",
        order,
      });
    }
  } catch (err) {
    if (
      err.message === "Order items required" ||
      err.message === "User ID required" ||
      err.message === "Address ID required"
    ) {
      return res.status(400).json({ error: err.message });
    }

    // Handle insufficient stock errors
    if (
      typeof err.message === "string" &&
      (err.message.includes("Insufficient stock") || err.message.includes("not found"))
    ) {
      return res.status(400).json({ error: err.message });
    }

    console.error("ORDER CREATE ERROR:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await updateOrderStatusService(req.params.id, req.body.status);
    res.json({
      message: "Order status updated",
      order,
    });
  } catch (err) {
    if (err.message === "Invalid order status") {
      return res.status(400).json({ error: err.message });
    }

    if (err.message === "Order not found") {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: err.message });
  }
};

export const fetchOrderEta = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await getOrderEtaService({
      orderId: req.params.id,
      requesterUserId: userId,
    });

    return res.json(result);
  } catch (err) {
    if (err.message === "Order not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message === "Forbidden") {
      return res.status(403).json({ error: err.message });
    }

    if (
      err.message === "Order not dispatched" ||
      err.message === "Order address missing" ||
      err.message === "Order address not found" ||
      err.message === "Order address coordinates missing"
    ) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to fetch ETA" });
  }
};

export const fetchMyOrdersEtaList = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await getOrdersEtaListService({ userId });
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch ETA list" });
  }
};
