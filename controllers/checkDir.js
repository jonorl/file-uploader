const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(__dirname, "..", "uploads");

const checkDir = (req, res, next) => {
  const user = req.user;
  const userDirPath = path.join(BASE_DIR, user.user_id.toString());

  if (!fs.existsSync(userDirPath)) {
    fs.mkdirSync(userDirPath, { recursive: true });
    console.log("created dirctory");
  } else {
    console.log("directory already exists");
  }
  req.userDir = userDirPath;
  next();
};

module.exports = { checkDir };