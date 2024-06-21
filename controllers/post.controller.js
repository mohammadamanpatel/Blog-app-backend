import Post from "../models/post.model.js";
import uploadImageToCloudinary from "../utils/uploadImageToCloudinary.js";
import multer from "multer";
import fs from "fs";
import deleteImageFromCloudinary from "../utils/deleteImageFromCloudinary.js";

const upload = multer({ dest: "uploads/" }); // Assuming 'uploads/' is your upload directory

export const create = async (req, res) => {
  upload.single("image"), // Use multer to handle single file upload
    console.log("req.body in post creation", req.body);
  console.log("req.user", req.user);

  if (!req.user.isAdmin) {
    return res.status(403).json({
      message: "You are not allowed to create a post",
    });
  }

  if (!req.body.title || !req.body.content) {
    return res.status(400).json({
      message: "Please provide all required fields",
    });
  }

  const slug = req.body.title
    .split(" ")
    .join("-")
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-]/g, "");

  try {
    let imageUrl = null;
    if (req.file) {
      const cloudinaryResponse = await uploadImageToCloudinary(
        req.file.path,
        "posts"
      );
      fs.unlink(req.file.path, (err) => {
        // Remove the file after uploading
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("Local file deleted");
        }
      });
      imageUrl = {
        public_id: cloudinaryResponse.public_id,
        secure_url: cloudinaryResponse.secure_url,
      };
    }

    const newPost = new Post({
      userId: req.user.id,
      content: req.body.content,
      title: req.body.title,
      image: imageUrl,
      category: req.body.category || "uncategorized",
      slug,
    });

    const savedPost = await newPost.save();
    console.log("savedPost", savedPost);
    res.status(201).json({ savedPost, message: "post created successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};
// Update a post
export const updatepost = async (req, res) => {
  try {
    console.log("req.params.postId", req.params.postId);
    const postId = req.params.postId; // Extract the post ID from the request parameters
    console.log("req.body in post update", req.body);
    const { title, content, category } = req.body; // Extract updated fields from request body
    console.log("req.user", req.user);
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        message: "You are not allowed to update this post",
      });
    }

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // Update the post fields
    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;

    // Update the post image if a new image is provided
    console.log("req.file in post update", req.file);
    if (req.file) {
      try {
        // Upload the new image to Cloudinary
        const cloudinaryResponse = await uploadImageToCloudinary(
          req.file.path,
          "posts"
        );

        // Delete the old image from Cloudinary if it exists
        if (post.image && post.image.public_id) {
          await deleteImageFromCloudinary(post.image.public_id);
        }

        // Update the post's image details
        post.image = {
          public_id: cloudinaryResponse.public_id,
          secure_url: cloudinaryResponse.secure_url,
        };

        // Delete the local file after uploading to Cloudinary
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("Local file deleted");
          }
        });
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error.message);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to Cloudinary",
          error: error.message,
        });
      }
    }

    // Save the updated post
    const updatedPost = await post.save();
    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getposts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.order === "asc" ? 1 : -1;
    const posts = await Post.find({
      ...(req.query.userId && { userId: req.query.userId }),
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.slug && { slug: req.query.slug }),
      ...(req.query.postId && { _id: req.query.postId }),
      ...(req.query.searchTerm && {
        $or: [
          { title: { $regex: req.query.searchTerm, $options: "i" } },
          { content: { $regex: req.query.searchTerm, $options: "i" } },
        ],
      }),
    })
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit);
    console.log("posts",posts);  
    const totalPosts = await Post.countDocuments();

    const now = new Date();

    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );

    const lastMonthPosts = await Post.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      posts,
      totalPosts,
      lastMonthPosts,
    });
  } catch (error) {
    console.log("error",error);
    res.status(500).json({
      error: error,
      message: "Internal server error",
    });
  }
};
export const deletepost = async (req, res, next) => {
  console.log("req.user", req.user);
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return res.status(404).json({
      message: "You have no authority to delete",
    });
  }
  try {
    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json("The post has been deleted");
  } catch (error) {
    res.status(500).json({
      message: "internal server error",
      error: error,
    });
  }
};
