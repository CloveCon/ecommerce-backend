import {
  getRiderDeliveries,
  updateRiderDeliveryStatus,
  updateRiderAvailability,
  getRiderDeliveryEta,
} from "../services/riders.services.js";

export const fetchRiderDeliveries = async (req, res) => {
  try {
    const riderId = req.admin?.id;

    if (!riderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const activeOnly = String(req.query.active || "").toLowerCase() === "true";

    const result = await getRiderDeliveries({
      riderId,
      page,
      limit,
      status: req.query.status,
      from: req.query.from,
      to: req.query.to,
      activeOnly,
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch deliveries" });
  }
};

export const updateRiderStatus = async (req, res) => {
  try {
    const riderId = req.admin?.id;

    if (!riderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const status = req.body?.status;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const order = await updateRiderDeliveryStatus({
      riderId,
      orderId: req.params.id,
      status,
    });

    return res.json({
      message: "Delivery status updated",
      order,
    });
  } catch (err) {
    if (err.message === "Invalid delivery status") {
      return res.status(400).json({ error: err.message });
    }

    if (err.message === "Order not found or not assigned") {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to update delivery status" });
  }
};

export const updateRiderAvailabilityStatus = async (req, res) => {
  try {
    const riderId = req.admin?.id;

    if (!riderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isActive = req.body?.is_active;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "is_active must be boolean" });
    }

    const rider = await updateRiderAvailability({ riderId, isActive });

    return res.json({
      message: "Rider availability updated",
      rider,
    });
  } catch (err) {
    if (err.message === "Rider not found") {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to update availability" });
  }
};

export const fetchRiderDeliveryEta = async (req, res) => {
  try {
    const riderId = req.admin?.id;

    if (!riderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await getRiderDeliveryEta({
      riderId,
      orderId: req.params.id,
    });

    return res.json(result);
  } catch (err) {
    if (
      err.message === "Order not found" ||
      err.message === "Order not found or not assigned"
    ) {
      return res.status(404).json({ error: err.message });
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
