const { v2: cloudinary } = require("cloudinary");
const path = require("path");
require("dotenv").config();
const db = require("../db/queries");
const { dir } = require("console");

(async function () {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
})();

const cloudinaryFileManager = {
  create: async (req, res, next) => {
    // req.file.path comes from Multer (a.k.a "upload" on router)
    try {
      let isSubFolder = false;
      let subfolderPath = "";
      let result;

      // IF there's a subfolder name, set it to subfolderPath var
      if (typeof req.params.subfolder !== "undefined") {
        subfolderPath = req.params.subfolder;
        isSubFolder = true;
      }

      // Upload to Cloudinary

      result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto",
        overwrite: true,
        asset_folder: subfolderPath,
        context: {
          custom: {
            user_id: req.user.user_id.toString(),
          },
        },
      });
      req.cloudinaryResponse = result;
      req.isSubFolder = isSubFolder;
      next();
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      next(err);
    }
  },

  read: async (req, res, next) => {
    let isSubFolder = false;
    try {
      let subfolderPath = "";
      if (typeof req.params.subfolder !== "undefined") {
        subfolderPath = req.params.subfolder;
        isSubFolder = true;
      }
      let resources = [];

      const publicIDsArray = db.getFilesBasedOnIDAndFolder(
        req.user.user_id,
        subfolderPath
      );

      // New attempt
      for (const id of await publicIDsArray) {
        try {
          const resource = await cloudinary.api.resource(id.public_id || id);
          resources.push(resource);
        } catch (err) {}
      }

      // // If on subfolder
      // if (isSubFolder) {
      //   resources = await cloudinary.api.resources_by_asset_folder(
      //     subfolderPath,
      //     { max_results: 100, context: true }
      //   );

      //   resources.resources = resources.resources.filter(
      //     (file) =>
      //       file.context?.custom?.user_id === req.user.user_id.toString()
      //   );





      // Let's try to get rid of this:
         rootFolders = await cloudinary.api.sub_folders(subfolderPath);






      //   // If on root
      // } else {
      //   rootFolders = await cloudinary.api.root_folders({
      //     max_results: 100,
      //   });
      //   // rootFolders = await cloudinary.api.sub_folders("");
      //   resources = await cloudinary.api.resources({
      //     max_results: 100,
      //     type: "upload",
      //     context: true,
      //     with_field: "context",
      //   });

      //   resources.resources = resources.resources.filter(
      //     (file) =>
      //       file.context?.custom?.user_id === req.user.user_id.toString()
      //   );

      //   resources.resources = resources.resources.filter(
      //     (res) => res.asset_folder === ""
      //   );
      // }

      // // add the missing original name INDEX/MATCHING from resources using public_id
      // for (const file of resources.resources) {
      //   file.user = req.user.user_id;
      //   const dbFile = await db.getFileName(file.public_id, req.user.user_id);
      //   if (dbFile) {
      //     file.original_name = dbFile.original_name;
      //   } else {
      //     file.original_name = null;
      //   }
      // }
      req.cloudinaryRootFolderRead = rootFolders;
      req.cloudinaryListFiles = resources;
      console.log("req.cloudinaryListFiles", req.cloudinaryListFiles)
      next();
    } catch (err) {
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

      const dbFile = await db.getFileName(
        req.fileDetails.public_id,
        req.user.user_id
      );
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
  folderDelete: async (req, res, next) => {
    const subfolder = req.params.dir;
    try {
      await cloudinary.api.delete_folder(subfolder);
      next();
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw error;
    }
  },
  folderCreate: async (req, res, next) => {
    try {
      const subfolderName = req.body.dirName;
      const filePath = path.resolve(__dirname, "placeholder.png");
      let fullPath = subfolderName;

      // If in a subfolder, prepend the existing path
      if (req.params.subfolder) {
        fullPath = `${req.params.subfolder}/${subfolderName}`;
      }

      await cloudinary.api.create_folder(fullPath);

      next();
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      next(err);
    }
  },
};

module.exports = cloudinaryFileManager;
