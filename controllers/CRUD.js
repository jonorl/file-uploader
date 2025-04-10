const fs = require("fs");
const path = require("path");

const BASE_DIR = path.resolve(__dirname, "..", "uploads");

const getPath = (req, res) => {
  console.log('!!! INSIDE getPath - req.params:', JSON.stringify(req.params));
  const user = req.user;
  let userDirPath = path.join(BASE_DIR, user.user_id.toString());
  // Check if there are any params, and if so add them to the path
  if (req.params && Object.keys(req.params).length > 2) {
    const extraParams = Object.values(req.params).filter(Boolean).shift();
    userDirPath = path.join(userDirPath, ...extraParams);
  } else if(req.params && Object.keys(req.params).length === 2){
    const extraParams = Object.values(req.params).filter(Boolean).shift();
    userDirPath = path.join(userDirPath, extraParams);
  }
  return userDirPath;
};

const fileManager = {
  read: (req, res, next) => {
    const userPath = getPath(req, res);
    if (req.isNavigateUp) {
      // const parentPath = path.dirname(userPath);
      // req.parentPath = parentPath;
      const currentUrlPath = req.path;
      const parentUrlPath = path.posix.dirname(currentUrlPath);
      req.parentPath = parentUrlPath
      console.log(parentUrlPath)
    }
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
    const newDirPath = path.join(rootDirPath, req.body.dirName);
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
    const dirName = req.body.newName;
    const rootDirPath = getPath(req, res);
    const oldName = path.join(rootDirPath, req.params.oldName);
    const newName = path.join(rootDirPath, dirName);
    fs.rename(oldName, newName, (err) => {
      if (err) throw err;
      console.log("directory name updated successfullly!");
    });
    next();
  },

  updateFileName: (req, res, next) => {
    const fileName = req.body.newName;
    const rootDirPath = getPath(req, res);
    const oldName = path.join(rootDirPath, req.params.oldName);
    const newName = path.join(rootDirPath, fileName);
    fs.rename(oldName, newName, (err) => {
      if (err) throw err;
      console.log("file name updated successfullly!");
    });
    next();
  },
  deleteDir: (req, res, next) => {
    const dirName = req.params.dir;
    const rootDirPath = getPath(req, res);
    const fullPath = path.join(rootDirPath, dirName);
    fs.rm(fullPath, { recursive: true }, (err) => {
      if (err) throw err;
      console.log("directory deleted successfullly!");
    });
    next();
  },
  deleteFile: (req, res, next) => {
    const fileName = req.params.file;
    const rootDirPath = getPath(req, res);
    const fullPath = path.join(rootDirPath, fileName);
    fs.unlink(fullPath, (err) => {
      if (err) throw err;
      console.log("file deleted successfullly!");
    });
    next();
  },
};

module.exports = fileManager;
