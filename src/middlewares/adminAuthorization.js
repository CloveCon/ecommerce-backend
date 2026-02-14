import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.admin_token;

  console.log("Auth Debug:", {
    authHeader,
    cookieToken,
    hasAuthHeader: !!authHeader,
    hasCookie: !!cookieToken
  });

  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const token = headerToken || cookieToken;

  if (!token) {
    console.log("Auth Debug: No token found");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

