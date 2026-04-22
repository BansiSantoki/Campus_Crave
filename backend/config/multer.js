import multer from "multer";
import path from "path";
import fs from "fs";


// This function applies a file filter to ensure only images are uploaded
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP)"), false);
  }
};


// This function ensures the upload directory exists, creating it if necessary.
const ensureUploadDir = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    // recursive:true creates the full nested path if missing.
    fs.mkdirSync(folderPath, { recursive: true });
  }
};


// This function creates a multer upload instance with specified folder, prefix, and file size limit.
const createImageUpload = ({ folder, prefix, maxFileSizeMB = 5 }) => {
  const uploadDir = path.join("uploads", folder);
  ensureUploadDir(uploadDir);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Timestamp + random number helps avoid filename collisions.
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });


  // multer will automatically reject files larger than the specified limit and pass an error to the route handler.


  return multer({
    storage,
    fileFilter,
    limits: {
      // Multer expects size in bytes, config is in MB.
      fileSize: maxFileSizeMB * 1024 * 1024,
    },


    //multer reurns a storage engine that handles file uploads, and the fileFilter function checks the file type before saving. The limits option ensures that files larger than the specified size are rejected. The ensureUploadDir function creates the necessary upload directory if it doesn't exist, preventing errors when saving files.
  });
};
export const uploadProfilePic = createImageUpload({
  folder: "profilePics",
  prefix: "profile",
  maxFileSizeMB: 5,
});
export const uploadProductImage = createImageUpload({
  folder: "products",
  prefix: "product",
  maxFileSizeMB: 3,
});
