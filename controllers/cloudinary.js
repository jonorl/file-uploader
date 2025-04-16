const { v2: cloudinary } = require("cloudinary");
const path = require("path");
require("dotenv").config();
const db = require("../db/queries");

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
      console.log("resources: ", resources.resources);
      // add the missing original name INDEX/MATCHING from resources using public_id
      for (const file of resources.resources) {
        const dbFile = await db.getFileName(file.public_id);
        if (dbFile) {
          // Only proceed if dbFile exists
          console.log("dbFile original_name: ", dbFile.original_name);
          file.original_name = dbFile.original_name;
        } else {
          file.original_name = null; // Or set a default value
        }

        // file.original_name = dbFile?.original_name;
      }
      req.cloudinaryRootFolderRead = rootFolders;
      req.cloudinaryListFiles = resources;
      console.log("resources: ", resources);
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
      console.log("cloudinary URL", result.url);
      next();
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      next(err);
    }
  },
  fileDetails: async (req, res, next) => {
    console.log("req.params.file: ", req.params.file);
    const publicID = req.params.file;
    cloudinary.api.resource(publicID, async function (error, result) {
      console.log("result:", result);
      req.fileDetails = result;
      console.log("req.fileDetails: ", req.fileDetails)

      const dbFile = await db.getFileName(req.fileDetails.public_id);
      if(dbFile)
      req.fileDetails = {
        ...req.fileDetails,
        originalName: dbFile.original_name
      }
      next();
      console.log("reqdetails updated: ", req.fileDetails)

      
    });
    // add the missing original name INDEX/MATCHING from resources using public_id



  },
};

module.exports = cloudinaryFileManager;
