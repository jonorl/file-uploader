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
        asset_folder: req.user.user_id + "/" + subfolderPath,
        context: {
          custom: {
            user_id: req.user.user_id.toString(),
          },
        },
      });
      req.cloudinaryResponse = result;
      req.isSubFolder = isSubFolder;

      // split last subfolder from parent subfolders

      const fullPath = req.cloudinaryResponse.asset_folder;
      const pathParts = fullPath.replace(/^\/|\/$/g, "").split("/");
      const finalSubfolder = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join("/");
      req.finalSubfolder = finalSubfolder;
      req.parentSubfolders = parentPath;

      next();
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      next(err);
    }
  },

  read: async (req, res, next) => {
    let isSubFolder = false;
    try {
      let subfolderPath = "/";
      if (req.params.subfolder && req.params.subfolder !== "") {
        subfolderPath = req.params.subfolder;
        isSubFolder = true;
      }
      let resources = [];

      // get folder and subfolder names

      let fullPath = subfolderPath;
      if (fullPath.endsWith('/')) {
        fullPath = fullPath.slice(0, -1);
      }
      const pathParts = fullPath.replace(/^\/|\/$/g, "").split("/");
      const finalSubfolder = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join("/");
      subfolderPath = parentPath + "/" + finalSubfolder;

      let publicIDsArray
      // If there's more than one subfolder
      if (isSubFolder && fullPath.split("/").length === 1) {
        publicIDsArray = db.getFilesBasedOnIDAndFolder(
          req.user.user_id,
          finalSubfolder,
          req.user.user_id + parentPath
        );
      } 
      else if (isSubFolder && fullPath.split("/").length > 1) {
        publicIDsArray = db.getFilesBasedOnIDAndFolder(
          req.user.user_id,
          finalSubfolder,
          req.user.user_id + "/" + parentPath
        );
      } else {
        publicIDsArray = db.getFilesBasedOnIDAndFolder(
          req.user.user_id,
          req.user.user_id + finalSubfolder,
          parentPath
        );
      }



      for (const id of await publicIDsArray) {
        try {
          const resource = await cloudinary.api.resource(id.public_id || id);
          resources.push(resource);
        } catch (err) {}
      }

      rootFolders = await cloudinary.api.sub_folders(
        "/" + req.user.user_id + "/" + subfolderPath
      );
      // add the missing original name INDEX/MATCHING from resources using public_id
      for (const file of resources) {
        file.user = req.user.user_id;
        const dbFile = await db.getFileName(file.public_id, req.user.user_id);
        if (dbFile) {
          file.original_name = dbFile.original_name;
        } else {
          file.original_name = null;
        }
      }

      req.cloudinaryRootFolderRead = rootFolders;
      req.cloudinaryListFiles = resources;
      next();
    } catch (err) {
      next(err);
    }
  },

  fileDetails: async (req, res, next) => {
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
      let fullPath = subfolderName;

      // If in a subfolder, prepend the existing path
      if (req.params.subfolder) {
        fullPath = `${req.params.subfolder}/${subfolderName}`;
      }

      await cloudinary.api.create_folder(req.user.user_id + "/" + fullPath);

      next();
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      next(err);
    }
  },

  folderRename: async (req, res, next) => {
    try {
      const oldFolderName = req.params.oldName;
      const newFolderName = req.body.newName;

      // Split subfolder names

      const fullPath = oldFolderName;
      const pathParts = fullPath.replace(/^\/|\/$/g, "").split("/");
      const finalSubfolder = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join("/");

      const cloudinaryNewName = parentPath + "/" + newFolderName;

      // Here be the DB folderName change

      db.changeFolderName(req.user, finalSubfolder, parentPath, newFolderName);

      await cloudinary.api.rename_folder(oldFolderName, cloudinaryNewName);
      next();
    } catch (err) {
      console.error("Cloudinary folder rename error:", err);
      next(err);
    }
  },
};

module.exports = cloudinaryFileManager;
