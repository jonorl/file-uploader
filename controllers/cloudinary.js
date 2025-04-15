const { v2: cloudinary } = require("cloudinary");
const path = require("path");
require("dotenv").config();

(async function () {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
})();

const cloudinaryFileManager = {
  read: (req, res, next) => {
    next();
  },
  create: (req, res, next) => {
    // req.file.path comes from Multer (a.k.a "upload" on router)
    cloudinaryUpload = cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
    });
    req.uploadResult = cloudinaryUpload;
    next();
  },
};

module.exports = cloudinaryFileManager;
