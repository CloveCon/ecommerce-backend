// import jwt from "jsonwebtoken";

// export const adminAuth = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.admin = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Invalid or expired token" });
//   }
// };


  // TEMPORARY: bypass authentication for development TESTING PURPOSES ONLY
export const adminAuth = (req, res, next) => {
  next();
};
