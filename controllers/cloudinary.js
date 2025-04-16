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
      next();
    } catch (err) {
      next(err);
    }
  },
  create: async (req, res, next) => {
    // req.file.path comes from Multer (a.k.a "upload" on router)
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto",
        overwrite: true,
      });

      // Attach the result to the request object
      req.cloudinaryResponse = result;
      console.log("cloudinaryResponse: ", result);
      console.log("cloudinary URL", result.url)
      next();
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      next(err);
    }
  },
};

module.exports = cloudinaryFileManager;
