import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.admin_token;


  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const token = headerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Only allow admin, super_admin, or rider roles
      if (!decoded.role || !["admin", "super_admin", "rider"].includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

