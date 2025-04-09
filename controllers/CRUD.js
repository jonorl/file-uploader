const fs = require("fs");
const path = require("path");

const BASE_DIR = path.resolve(__dirname, "..", "uploads");

const getPath = (req, res) => {
  const user = req.user;
  const userDirPath = path.join(BASE_DIR, user.user_id.toString());
  return userDirPath;
};

const fileManager = {
  read: (req, res, next) => {
    const userPath = getPath(req, res);
    try {
      const items = fs.readdirSync(userPath);
      const directories = [];
      const files = [];

      items.forEach((item) => {
        const itemPath = path.join(userPath, item);
        const stat = fs.lstatSync(itemPath);
        if (stat.isDirectory()) {
          directories.push(item);
        }
        if (stat.isFile()) files.push(item);
      });
      req.directories = { type: "directory", directories: directories };
      req.files = { type: "file", files: files };

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: (req, res, next) => {
    const rootDirPath = getPath(req, res);
    const newDirPath = path.join(rootDirPath, req.body.dirName)
    try {
      if (fs.existsSync(newDirPath)) {
        return res.status(409).json({ error: "Directory already exists." });
      }
  
      fs.mkdirSync(newDirPath, { recursive: true });
      console.log("Directory created.");
      next();
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
  updateDirName: (req, res, next) => {
    const dirName = req.body.newName
    const rootDirPath = getPath(req, res);
    const oldName = path.join(rootDirPath, req.params.oldName)
    const newName = path.join(rootDirPath, dirName)
    fs.rename(oldName, newName, (err) => {
      if (err) throw err;
      console.log('directory updated successfullly!')
    })
    next();
  }
};

module.exports = fileManager;
