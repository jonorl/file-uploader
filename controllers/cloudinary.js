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
      let subfolderPath = ""
      if (req.params.subfolder) {
        console.log(req.params.subfolder)
        subfolderPath = req.params.subfolder
      }
      const [rootFolders, resources] = await Promise.all([
        cloudinary.api.root_folders(),
        cloudinary.api.resources({ type: 'upload', max_results: 100, prefix: `${subfolderPath ? subfolderPath + '/' : ''}` }),
      ]);

      // add the missing original name INDEX/MATCHING from resources using public_id
      for (const file of resources.resources) {
        const dbFile = await db.getFileName(file.public_id);
        if (dbFile) {
          file.original_name = dbFile.original_name;
        } else {
          file.original_name = null;
        }
      }
      req.cloudinaryRootFolderRead = rootFolders;
      req.cloudinaryListFiles = resources;
      console.log("root folder: ", rootFolders.folders);
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
      req.cloudinaryResponse = result;
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
      if (Math.round(req.fileDetails) > 1048576) {
        req.fileSizeUnit = "MB";
      } else req.fileSizeUnit = "Kb";

      const dbFile = await db.getFileName(req.fileDetails.public_id);
      if (dbFile)
        req.fileDetails = {
          ...req.fileDetails,
          originalName: dbFile.original_name,
        };
      next();
    });
  },
  fileRename: async (req, res, next) => {
    const publicID = req.params.oldName;
    const newName = req.body.newName;
    db.updateName(publicID, newName);
    console.log("file name updated sucessfully");
    next();
  },
  fileDelete: async (req, res, next) => {
    const publicID = req.params.file;

    try {
      await cloudinary.uploader.destroy(publicID);
      db.delFile(publicID);
      next();
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw error;
    }
  },
};

module.exports = cloudinaryFileManager;
