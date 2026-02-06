import {
  createOrder as createOrderService,
  getOrders,
  getOrdersByUserId,
  getOrderEta as getOrderEtaService,
  getOrdersEtaList as getOrdersEtaListService,
  updateOrderStatus as updateOrderStatusService,
} from "../services/orders.services.js";

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
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const createOrder = async (req, res) => {
  try {
    const order = await createOrderService(req.body);
    res.json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    if (
      err.message === "Order items required" ||
      err.message === "User ID required" ||
      err.message === "Address ID required"
    ) {
      return res.status(400).json({ error: err.message });
    }

    // Handle insufficient stock errors
    if (err.message.includes("Insufficient stock") || err.message.includes("not found")) {
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
