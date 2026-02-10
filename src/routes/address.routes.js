import express from "express";
import { userAuth } from "../middlewares/userAuthorization.js";
import {
  fetchAddresses,
  addAddress,
  editAddress,
  removeAddress,
  updateAddressCoordinates,
} from "../controllers/addresses.controller.js";

const router = express.Router();

// GET list of addresses
router.get("/", userAuth, fetchAddresses);

// CREATE address
router.post("/", userAuth, addAddress);

// UPDATE address
router.patch("/:id", userAuth, editAddress);

// UPDATE address coordinates
router.patch("/:id/coordinates", userAuth, updateAddressCoordinates);

// DELETE address
router.delete("/:id", userAuth, removeAddress);

export default router;
