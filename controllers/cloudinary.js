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
  read: async (req, res, next) => {
    try {
      const [rootFolders, resources] = await Promise.all([
        cloudinary.api.root_folders(),
        cloudinary.api.resources({ max_results: 100 }),
      ]);

      req.cloudinaryRootFolderRead = rootFolders;
      req.cloudinaryListFiles = resources;
      console.log(req.cloudinaryRootFolderRead)
      next();
    } catch (err) {
      next(err);
    }
  },
  create: async (req, res, next) => {
    // req.file.path comes from Multer (a.k.a "upload" on router)
    cloudinaryUpload = await cloudinary.uploader
      .upload(req.file.path, {
        resource_type: "auto",
        overwrite: true,
      })
      .then((result) => {
        req.cloudinaryResponse = result;
        // take result.bytes, public_id, created_at, url, asset_folder, display_name, original_filename
        console.log("cloudinaryResponse: ", result);
        next();
      });
    req.uploadResult = cloudinaryUpload;
  },
};

module.exports = cloudinaryFileManager;
