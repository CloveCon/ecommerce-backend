import express from "express";
import { userAuth } from "../middlewares/userAuthorization.js";
import {
  fetchAddresses,
  addAddress,
  editAddress,
  removeAddress,
} from "../controllers/addresses.controller.js";

const router = express.Router();

// GET list of addresses
router.get("/", userAuth, fetchAddresses);

// CREATE address
router.post("/", userAuth, addAddress);

// UPDATE address
router.patch("/:id", userAuth, editAddress);

// DELETE address
router.delete("/:id", userAuth, removeAddress);

export default router;
