import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminOrderRoutes from "./routes/admin.order.routes.js";
import adminAdminsRoutes from "./routes/admin.admins.routes.js";
import adminProductRoutes from "./routes/admin.product.routes.js";
import adminAuthRoutes from "./routes/admin.auth.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminPaymentRoutes from "./routes/admin.payment.routes.js";
import adminDashboardRoutes from "./routes/admin.dashboard.routes.js";
import adminCustomerRoutes from "./routes/admin.customer.routes.js";
import adminReportsRoutes from "./routes/admin.reports.routes.js";
import adminReviewsRoutes from "./routes/admin.reviews.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import riderRoutes from "./routes/rider.routes.js";
import adminCategoriesRoutes from "./routes/admin.categories.routes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";
import adminProfileRoutes from "./routes/admin.profile.routes.js";
import addressRoutes from "./routes/address.routes.js";


const app = express();

app.use(cors({
  origin: [
    "https://ecommerce-admin-panel-2v7h.onrender.com",
    "https://ecommerce-website-bsr5.onrender.com",
    "http://localhost:3001",
    "http://localhost:3000"
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

app.use((req, res, next) => {
  req.upload = upload;
  next();
});


app.get("/", (req, res) => {
  res.send("Backend is running");
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/admins", adminAdminsRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/reports", adminReportsRoutes);
app.use("/api/admin/reviews", adminReviewsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/admin/categories", adminCategoriesRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/admin/profile", adminProfileRoutes);

export default app;

