import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../services/addresses.services.js";

const REQUIRED_FIELDS = [
  "full_name",
  "phone",
  "line1",
  "city",
  "state",
  "postal_code",
  "country",
];

export const fetchAddresses = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await listAddresses(userId);
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch addresses" });
  }
};

export const addAddress = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const missing = REQUIRED_FIELDS.filter(
      (field) => !req.body?.[field]
    );

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const address = await createAddress(userId, req.body);
    return res.status(201).json({
      message: "Address created",
      address,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create address" });
  }
};

export const editAddress = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allowedFields = [
      "full_name",
      "phone",
      "line1",
      "line2",
      "city",
      "state",
      "postal_code",
      "country",
      "latitude",
      "longitude",
      "is_default",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const address = await updateAddress(userId, req.params.id, updates);
    return res.json({
      message: "Address updated",
      address,
    });
  } catch (err) {
    if (err.message === "Address not found") {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to update address" });
  }
};

export const removeAddress = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await deleteAddress(userId, req.params.id);
    return res.json({ message: "Address deleted" });
  } catch (err) {
    if (err.message === "Address not found") {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to delete address" });
  }
};
