const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(__dirname, "..", "uploads");

const checkDir = (req, res, next) => {
  const user = req.user;
  if (typeof user !== "undefined") {
    let userDirPath = path.join(BASE_DIR, user.user_id.toString());
    // get params if any

    const referer = req.get("Referer");
    let subfolderPath;

    if (referer) {
      const url = new URL(referer);
      const match = url.pathname.match(/^\/upload(\/.*)?$/);
      subfolderPath = match && match[1] ? match[1] : "";
    }
    if (typeof subfolderPath !== "undefined") {
      console.log("userDirPath: ", userDirPath);
      console.log("subfolderPath: ", subfolderPath);
      userDirPath = path.join(userDirPath, subfolderPath);
    }

    if (!fs.existsSync(userDirPath)) {
      fs.mkdirSync(userDirPath, { recursive: true });
      console.log("created dirctory");
    } else {
      console.log("directory already exists");
    }
    req.userDir = userDirPath;
  }
  next();
};
module.exports = { checkDir };
