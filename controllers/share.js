const db = require("../db/queries");
const { randomUUID } = require("crypto");

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

async function validateUUID(req, res) {
  const uuid = req.params.uuid;
  const now = new Date();
  const link = await db.getSharedLink(uuid);
  const expiryDate = new Date(link.expires_at);
  const parentFolder = link.parent_folder.slice((link.user_id.toString().length) + 1)
  console.log("parentFolder", parentFolder)
  console.log("rawParent",link.parent_folder )
  console.log("link.user_id.toString().length",link.user_id.toString().length)
  if (now < expiryDate) {
    res.redirect(`/upload/${parentFolder}/${link.asset_folder}`);
  } else res.send("Link has expired");
}

module.exports = { createShareLink, validateUUID };
