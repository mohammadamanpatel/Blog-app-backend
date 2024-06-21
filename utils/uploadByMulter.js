import multer from 'multer';

// Define storage settings for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the directory where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Define the filename for uploaded files
  },
});

// Initialize multer instance with storage settings
export const upload = multer({ storage: storage });
