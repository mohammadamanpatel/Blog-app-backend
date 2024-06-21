import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  create,
  deletepost,
  getposts,
  updatepost,
} from "../controllers/post.controller.js";
import { upload } from "../utils/uploadByMulter.js";

const router = express.Router();

router.post("/create", verifyToken, upload.single("image"), create);
router.get("/getposts", getposts);
router.delete("/deletepost/:postId/:userId", verifyToken, deletepost);
router.put(
  "/updatepost/:postId",
  verifyToken,
  upload.single("image"),
  updatepost
);

export default router;
