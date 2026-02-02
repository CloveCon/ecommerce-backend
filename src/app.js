import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminOrderRoutes from "./routes/admin.order.routes.js";
import adminProductRoutes from "./routes/admin.product.routes.js";
import adminAuthRoutes from "./routes/admin.auth.routes.js";
import adminPaymentRoutes from "./routes/admin.payment.routes.js";
import adminDashboardRoutes from "./routes/admin.dashboard.routes.js";
import adminCustomerRoutes from "./routes/admin.customer.routes.js";
import adminReportsRoutes from "./routes/admin.reports.routes.js";
import adminReviewsRoutes from "./routes/admin.reviews.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});


// API Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/reports", adminReportsRoutes);
app.use("/api/admin/reviews", adminReviewsRoutes);

export default app;

