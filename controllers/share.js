const db = require("../db/queries");
const { randomUUID } = require("crypto");
const { v2: cloudinary } = require("cloudinary");


// Helper function

function calculateExpiryDate(option) {
  const expiresAt = new Date();

  switch (option) {
    case "1d":
      expiresAt.setDate(expiresAt.getDate() + 1);
      break;
    case "7d":
      expiresAt.setDate(expiresAt.getDate() + 7);
      break;
    case "30d":
      expiresAt.setDate(expiresAt.getDate() + 30);
      break;
  }
  return expiresAt;
}

async function createShareLink(req, res, next) {
  const uuid = randomUUID();
  const shareTimeOption = req.body.shreTimeSelect;
  const expiresAt = calculateExpiryDate(shareTimeOption);
  let subfolderPath = req.params.subfolder;

  let fullPath = subfolderPath;
  if (fullPath.endsWith("/")) {
    fullPath = fullPath.slice(0, -1);
  }
  const pathParts = fullPath.replace(/^\/|\/$/g, "").split("/");
  const finalSubfolder = pathParts[pathParts.length - 1];
  const parentPath = pathParts.slice(0, -1).join("/");
  subfolderPath = parentPath + "/" + finalSubfolder;

  db.addToShareTable(
    uuid,
    req.user.user_id,
    finalSubfolder,
    parentPath,
    expiresAt
  );

  req.shareLink = uuid;
  next();
}

async function validateUUID(req, res, next) {
  const uuid = req.params.uuid;
  const now = new Date();
  const link = await db.getSharedLink(uuid);
  const expiryDate = new Date(link.expires_at);
  const parentFolder = link.parent_folder.slice(
    link.user_id.toString().length + 1
  );
  if (now < expiryDate) {
    // res.redirect(`/upload/${parentFolder}/${link.asset_folder}`);
    req.shareLink = uuid
    next();
  } else res.send("Link has expired");
  
}

async function getShareLinkData(req, res, next) {
  let resources = [];

  try {
    const uuid = req.shareLink;
    console.log("uuid", uuid)
    const link = await db.getSharedLink(uuid);

    if (!link) {
      return res.status(404).send('Shared link not found');
    }

    const publicIDsArray = await db.getFilesBasedOnIDAndFolder(
      link.user_id,
      link.asset_folder,
      link.parent_folder
    );

    for (const id of publicIDsArray) {
      try {
        const resource = await cloudinary.api.resource(id.public_id || id);
        resources.push(resource);
      } catch (cloudinaryError) {
        console.error('Error fetching resource from Cloudinary:', cloudinaryError);
      }
    }

    for (const file of resources) {
      file.user = link.user_id;
      try {
        const dbFile = await db.getFileName(file.public_id, file.user);
        file.original_name = dbFile ? dbFile.original_name : null;
      } catch (dbError) {
        console.error('Error fetching file name from database:', dbError);
        file.original_name = null; 
      }
    }
    req.cloudinaryListFiles = resources;

    const subfolderPath = link.parent_folder + "/" + link.asset_folder;

    try {
      const rootFolders = await cloudinary.api.sub_folders(
        "/" + subfolderPath
      );
      console.log("rootFolders: ",rootFolders )
      req.cloudinaryRootFolderRead = rootFolders;
    } catch (cloudinarySubfolderError) {
      console.error('Error fetching subfolders from Cloudinary:', cloudinarySubfolderError);
      req.cloudinaryRootFolderRead = { folders: [] }; 
    }
    req.shareLink = uuid
    req.user = link.user_id
    next();

  } catch (error) {
    console.error('An error occurred in getShareLinkData:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = { createShareLink, validateUUID, getShareLinkData };
