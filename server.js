import express from "express";
import { config } from "dotenv";
import { v2 } from "cloudinary";
import cookie_parser from "cookie-parser";
import DBConnection from "./config/dbConnect.js";
import file_upload from "express-fileupload";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postsRoutes from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";

config();

// const __dirname = path.resolve();
// console.log("__dirname",__dirname);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie_parser());

app.listen(process.env.PORT, async () => {
  await DBConnection();
  console.log("our app is running on this portNo:=>", process.env.PORT);
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postsRoutes);
app.use("/api/comment", commentRoutes);

v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.use(
  file_upload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
// app.use(express.static(path.join(__dirname, '/client/dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });
