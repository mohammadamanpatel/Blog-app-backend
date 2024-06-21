import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
const cookieOption = {
  MaxAge: 100 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
};
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
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
  }
  const alreadyExists = await User.findOne({ email });
  if (alreadyExists) {
    return res.status(404).json({
      success: false,
      message: "user already exists",
    });
  }
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const user = new User({
    username,
    email,
    password: hashedPassword,
    avatar: {
      secure_url:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      public_id: "public_id",
    },
  });
  try {
    await user.save();
    console.log("user after signup", user);
    res.status(200).json({ message: "User created successfully!", user });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("email,password", email, password);
    if (!password || !email) {
      res.status(400).json({
        message: "some userCredentials are missing",
      });
    }
    let user = await User.findOne({ email }).select("+password"); //ye db call hai
    if (!user) {
      return res.status(401).json({
        sucess: false,
        message: "please signup",
      });
    }
    //3) fir check karo password

    console.log(password);
    console.log(user.password);
    if (await bcryptjs.compareSync(password, user.password)) {
      //jwt token generate karo;
      const payload = {
        id: user._id,
        isAdmin: user.isAdmin,
      };
      const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
      });
      //token generate ho chuka hai

      //user ke object me ise store kardiya
      console.log("jwtToken", jwtToken);
      user.jwtToken = jwtToken;
      console.log("user.jwtToken", user.jwtToken);
      //user ke object mese password null kardo warna privacy nhi rahegi isse actual db me koi change nhi
      //aayega means password sirf object me null hua hai jo findOne method se aaya

      user.password = null;

      //ab cookie banao token se
      // console.log("res.cookie",res.cookie("jwtToken", jwtToken, cookieOption));

      res.cookie("jwtToken", jwtToken, cookieOption);
      return res.status(200).json({
        success: true,
        jwtToken: jwtToken,
        message: "User Logged In",
        user,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "password incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const google = async (req, res, next) => {
  try {
    console.log("req.body in google auth",req.body);
    var user = await User.findOne({ email: req.body.email });
    if (user) {
      const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      user.jwtToken = jwtToken;
      user.password = null;
      console.log("user in google auth", user);
      res.cookie("jwtToken", jwtToken, cookieOption).status(200).json({
        success: true,
        user,
      });
      console.log("user", user);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      user = new User({
        username:
          req.body.name.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        avatar: {
          secure_url: req.body.photo,
          public_id: "public_id",
        },
      });
      await user.save();
      const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      user.jwtToken = jwtToken;
      user.password = null;
      console.log("user in google auth",user);
      res.cookie("jwtToken", jwtToken, cookieOption).status(200).json({
        message: "user signed in",
        success: true,
        jwtToken,
        user,
      });
      console.log("newUser", user);
    }
  } catch (error) {
    console.log("error in google fire base auth", error);
  }
};
export const signOut = async (req, res, next) => {
  try {
    res.clearCookie("jwtToken");
    res
      .status(200)
      .json({ success: true, message: "User has been logged out!" });
  } catch (error) {
    next(error);
  }
};
