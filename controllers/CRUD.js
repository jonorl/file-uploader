const fs = require("fs");
const { get } = require("http");
const path = require("path");

const BASE_DIR = path.resolve(__dirname, "..", "uploads");

const getPath = (req, res) => {
  const user = req.user;
  let userDirPath = path.join(BASE_DIR, user.user_id.toString());
  // Check if there are any params, and if so add them to the path
  if (req.params && Object.keys(req.params).length > 2) {
    const extraParams = Object.values(req.params).filter(Boolean).shift();
    userDirPath = path.join(userDirPath, ...extraParams);
    // this is to avoid the annoying {0} object that duplicates the first param.
  } else if (req.params && Object.keys(req.params).length === 2) {
    const extraParams = Object.values(req.params).filter(Boolean).shift();
    userDirPath = path.join(userDirPath, extraParams);
  }
  console.log("getPath: ", userDirPath);
  return userDirPath;
};

const fileManager = {
  read: (req, res, next) => {
    const userPath = getPath(req, res);

    let extraParams;
    let lastParam;
    console.log("params: ", req.params);
    console.log("len: ", Object.keys(req.params).length);
    const len = Object.keys(req.params).length;

        // get params if any

    if (req.params && Object.keys(req.params).length >= 2) {
      extraParams = Object.values(req.params).filter(Boolean).shift();
      lastParam =
        Object.values(req.params.subfolder).join("").split("/").pop() ||
        req.params.subfolder;
      // this is to avoid the annoying {0} object that duplicates the first param.
    } else if (req.params && Object.keys(req.params).length < 2) {
      extraParams = Object.values(req.params).filter(Boolean);
    }
    console.log("extra params: ", extraParams);
    console.log("root URL: ", req.get("host"));
    console.log("last param: ", lastParam);
    console.log(req.isNavigateUp)

    // if on a subfolder
    if (req.isNavigateUp) {
      const currentUrlPath = req.path;
      const parentUrlPath = path.posix.dirname(currentUrlPath);
      req.parentPath = `${req.protocol}://${req.get(
        "host"
      )}${parentUrlPath}/${extraParams}`;
      console.log("this parentPath: ", req.parentPath);
      req.goUpPath = `${req.protocol}://${req.get("host")}${parentUrlPath}`;
      req.lastParam = lastParam;
      console.log("getProtocol: ", req.protocol);
      console.log("current URL: ", req.currentUrlPath);
      console.log("goUpPath: ", req.goUpPath);
      console.log("parent URL Path: ", parentUrlPath);
      console.log("Full URL: ", req.get("host"), parentUrlPath);
      console.log(
        "Full URL + params: ",
        req.get("host"),
        parentUrlPath,
        "/",
        extraParams
      );
      console.log("req.parentPath: ", req.parentPath);

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
        req.showGoUp = true
        req.directories = { type: "directory", directories: directories };
        req.files = { type: "file", files: files };

        next();
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
    // If on root
    else
      try {
        const items = fs.readdirSync(userPath);
        const directories = [];
        const files = [];
        console.log("req.path: ", req.path);

        items.forEach((item) => {
          const itemPath = path.join(userPath, item);
          const stat = fs.lstatSync(itemPath);
          if (stat.isDirectory()) {
            directories.push(item);
          }
          if (stat.isFile()) files.push(item);
        });
        console.log("req.path: ", req.path);
        console.log("req path type: ", typeof req.path.substring(1));
        let pathHelper;
        if (req.path.substring(req.path.length - 1) === "/") {
          pathHelper = req.path.substring(0, req.path.length - 1);
        } else pathHelper = req.path;
        console.log("path helper: ", pathHelper);
        req.parentPath = `${req.protocol}://${req.get("host")}${pathHelper}`;
        req.directories = { type: "directory", directories: directories };
        req.files = { type: "file", files: files };

        next();
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
  },

  create: (req, res, next) => {
    const rootDirPath = getPath(req, res);
    let newDirPath = path.join(rootDirPath, req.body.dirName);
    const referer = req.get('Referer');
    let subfolderPath;

    if (referer) {
      const url = new URL(referer);
      const match = url.pathname.match(/^\/upload(\/.*)?$/);
    
      subfolderPath = match && match[1] ? match[1] : '';
      console.log("subPath:", subfolderPath);}

    console.log("undefined?: ",typeof subfolderPath )
    if (typeof subfolderPath !== 'undefined') {
      const currentUrlPath = req.path;
      const parentUrlPath = path.posix.dirname(currentUrlPath);
      // req.goUpPath = `${parentUrlPath}`;
      newDirPath = path.join(rootDirPath, subfolderPath, req.body.dirName);
      console.log("aca")
      console.log("currentURLPath: ", currentUrlPath)
      console.log("parentURLPath: ", parentUrlPath)
      console.log("newDirPath: ", newDirPath)
    }

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
