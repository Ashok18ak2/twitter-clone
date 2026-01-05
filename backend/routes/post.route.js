import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createPost,likeUnlikedpost,createComment,deletePost,getAllPosts,getLikedPosts,getFollowingPosts, getUserPost } from "../controllers/post.controller.js";


const router = express.Router();

router.get("/all", getAllPosts);
router.get("/likes/:id",protectRoute,getLikedPosts);
router.get("/following",protectRoute,getFollowingPosts);
router.get("/user/:username",protectRoute,getUserPost)
router.post("/create",protectRoute,createPost);
router.post("/like/:id",protectRoute,likeUnlikedpost);
router.post("/comment/:id",protectRoute,createComment);
router.delete("/:id",protectRoute,deletePost);

export  default router;