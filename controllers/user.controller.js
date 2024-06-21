import bcryptjs from "bcryptjs";
import User from "../models/user.model.js";
import fs from "fs";
import uploadImageToCloudinary from "../utils/uploadImageToCloudinary.js";

export const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log("userId, req.params.userId:", userId, req.params.userId);
    console.log("req.body:", req.body);

    // Check if the user ID from the request matches the authenticated user's ID
    if (req.user.id !== userId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const { username, email, password } = req.body;

    // Validate and construct the update object based on provided fields
    const updateFields = {};

    if (username) {
      if (username.length < 7 || username.length > 20) {
        return res
          .status(400)
          .json({ message: "Username must be between 7 and 20 characters" });
      }
      if (username.includes(" ")) {
        return res
          .status(400)
          .json({ message: "Username cannot contain spaces" });
      }
      if (username !== username.toLowerCase()) {
        return res.status(400).json({ message: "Username must be lowercase" });
      }
      if (!username.match(/^[a-zA-Z0-9]+$/)) {
        return res
          .status(400)
          .json({ message: "Username can only contain letters and numbers" });
      }
      updateFields.username = username;
    }

    if (email) {
      updateFields.email = email;
    }

    if (password) {
      if (password.length < 6) {
        return res
          .status(403)
          .json({ message: "Password length should be at least 6 characters" });
      }
      updateFields.password = bcryptjs.hashSync(password, 10);
    }

    // Check if a file was uploaded
    console.log("req.file in user update", req.file);
    if (req.file) {
      const avatarPath = req.file.path;
      const cloudinaryResponse = await uploadImageToCloudinary(
        avatarPath,
        "avatars"
      );
      console.log("cloudinaryResponse:", cloudinaryResponse);

      // Update avatar details in the updateFields object with Cloudinary response
      updateFields.avatar = {
        public_id: cloudinaryResponse.public_id,
        secure_url: cloudinaryResponse.secure_url,
      };

      // Delete the file from the local filesystem
      fs.rm(avatarPath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("Local file deleted");
        }
      });
    }

    // Update the user in the database
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    // Check if the user was found and updated
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.password = null

    // Respond with the updated user object
    res.status(200).json({user,message:"user updated successfully"});
  } catch (error) {
    // Handle any errors that occur during the update process
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req, res, next) => {
  if (!req.user.isAdmin && req.user.id !== req.params.userId) {
    return res.status(403).json({
      message: "You are not allowed to delete this user",
    });
  }
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.userId);
    console.log("deletedUser",deletedUser);
    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(200).json("User has been deleted");
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const signout = (req, res, next) => {
  try {
    res
      .clearCookie("access_token")
      .status(200)
      .json("User has been signed out");
  } catch (error) {
    res.status(500).json({
      messsage: "user cant logout",
      error: error,
    });
  }
};

export const getUsers = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      message: "You are not allowed to see all users",
    });
  }
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === "asc" ? 1 : -1;

    const users = await User.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    const usersWithoutPassword = users.map((user) => {
      const { password, ...rest } = user._doc;
      return rest;
    });

    const totalUsers = await User.countDocuments();

    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      users: usersWithoutPassword,
      totalUsers,
      lastMonthUsers,
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const { password, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};
