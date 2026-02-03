import app from "./app.js";
import { initializeStorage } from "./utils/initializeStorage.js";

const PORT = process.env.PORT || 5000;

// Initialize storage buckets on startup
initializeStorage();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});