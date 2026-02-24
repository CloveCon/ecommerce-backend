import {
    createWalkInOrder,
    getActiveWalkInOrders,
    updateWalkInOrderStatus,
} from "../services/walkin.services.js";

export const createNewWalkInOrder = async (req, res) => {
    try {
        const {
            items,
            order_type,
            table_number,
            customer_name,
            customer_phone,
            payment_method,
            discount,
            notes,
        } = req.body;

        const order = await createWalkInOrder({
            items,
            order_type,
            table_number,
            customer_name,
            customer_phone,
            payment_method,
            discount,
            notes,
            created_by: req.admin?.id,
        });

        return res.json({
            message: "Walk-in order created successfully",
            order,
        });
    } catch (err) {
        console.error("WALK-IN ORDER ERROR:", err);
        console.error("WALK-IN ERROR DETAILS:", JSON.stringify(err, null, 2));

        const msg = err.message || "";
        if (
            msg === "Order items required" ||
            msg.includes("Invalid or missing payment_method") ||
            msg.includes("Insufficient stock") ||
            msg.includes("not found") ||
            msg.includes("unavailable")
        ) {
            return res.status(400).json({ error: msg });
        }

        return res.status(500).json({ error: msg || "Failed to create walk-in order" });
    }
};

export const fetchActiveWalkInOrders = async (req, res) => {
    try {
        const orders = await getActiveWalkInOrders();
        return res.json({ data: orders });
    } catch (err) {
        console.error("FETCH WALK-IN ORDERS ERROR:", err);
        return res.status(500).json({ error: "Failed to fetch walk-in orders" });
    }
};

export const updateWalkInStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await updateWalkInOrderStatus(req.params.id, status);
        return res.json({ message: "Status updated", order });
    } catch (err) {
        if (err.message === "Invalid walk-in order status") {
            return res.status(400).json({ error: err.message });
        }
        if (err.message === "Walk-in order not found") {
            return res.status(404).json({ error: err.message });
        }
        return res.status(500).json({ error: "Failed to update status" });
    }
};
