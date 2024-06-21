import express from "express";
import {
  deleteUser,
  getUser,
  getUsers,
  signout,
  updateUser,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../utils/uploadByMulter.js";

const router = express.Router();

router.put("/update/:userId", verifyToken, upload.single("avatar"),updateUser);
router.delete("/delete/:userId", verifyToken, deleteUser);
router.get("/signout", signout);
router.get("/getusers", verifyToken, getUsers);
router.get("/:userId", getUser);

export default router;
