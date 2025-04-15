const fs = require("fs");
const fsPromise = require("fs").promises;
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
  return userDirPath;
};

function getDirectorySizeSync(dirPath) {
  let totalSize = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const stats = fs.statSync(fullPath);

    if (entry.isDirectory()) {
      totalSize += getDirectorySizeSync(fullPath); // recursive
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

const fileManager = {
  read: (req, res, next) => {
    const userPath = getPath(req, res);

    let extraParams;
    let lastParam;

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

    // if on a subfolder
    if (req.isNavigateUp) {
      const currentUrlPath = req.path;
      req.uploadPath = req.path;
      const parentUrlPath = path.posix.dirname(currentUrlPath);
      req.parentPath = `${req.protocol}://${req.get(
        "host"
      )}${parentUrlPath}/${lastParam}`;
      req.goUpPath = `${req.protocol}://${req.get("host")}${parentUrlPath}`;
      req.lastParam = lastParam;
      req.parentURLPath = parentUrlPath;

      try {
        const items = fs.readdirSync(userPath);
        const directories = [];
        const files = [];

        const trueStat = fs.statSync(userPath);
        if (trueStat.isDirectory()) {
          req.where = userPath;
          const size = Math.round(getDirectorySizeSync(userPath) / 1000); // Divided by 1,000 for kb
          if (size < 1000) {
            req.size = size;
            req.sizeUnit = "kb";
          } else {
            req.size = Math.round((size / 1000) * 10) / 10; // Divided by 1,000 for MB
            req.sizeUnit = "MB";
          }
          req.dateCreated = trueStat.birthtime;
          req.lastModified = trueStat.mtime;
        }

        items.forEach((item) => {
          const itemPath = path.join(userPath, item);
          console.log("item path: ", itemPath);
          const stat = fs.lstatSync(itemPath);
          if (stat.isDirectory()) {
            directories.push(item);
          }
          if (stat.isFile()) files.push(item);
        });
        req.showGoUp = true;
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

        const trueStat = fs.statSync(userPath);
        if (trueStat.isDirectory()) {
          req.where = userPath;
          const size = Math.round(getDirectorySizeSync(userPath) / 1000); // Divided by 1,000 for kb
          if (size < 1000) {
            req.size = size;
            req.sizeUnit = "kb";
          } else {
            req.size = Math.round((size / 1000) * 10) / 10; // Divided by 1,000 for MB
            req.sizeUnit = "MB";
          }
          req.dateCreated = trueStat.birthtime;
          req.lastModified = trueStat.mtime;
        }

        items.forEach((item) => {
          const itemPath = path.join(userPath, item);
          const stat = fs.lstatSync(itemPath);
          if (stat.isDirectory()) {
            directories.push(item);
          }
          if (stat.isFile()) files.push(item);
        });
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
    const referer = req.get("Referer");
    let subfolderPath;

    if (referer) {
      const url = new URL(referer);
      const match = url.pathname.match(/^\/upload(\/.*)?$/);

      subfolderPath = match && match[1] ? match[1] : "";
      console.log("subPath:", subfolderPath);
    }

    console.log("undefined?: ", typeof subfolderPath);
    if (typeof subfolderPath !== "undefined") {
      newDirPath = path.join(rootDirPath, subfolderPath, req.body.dirName);
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
    const rootDirPath = path.join(BASE_DIR, req.user.user_id.toString());

    // If on subfolder...
    if (req.params.oldName.toString().includes("/")) {
      const oldName = path.join(rootDirPath, req.params.oldName.slice(7)); // to hardcoding remove "/upload"
      const fixedName = path.posix.dirname(oldName);
      const newName = path.join(fixedName, dirName);
      fs.rename(oldName, newName, (err) => {
        if (err) throw err;
        console.log("directory name updated successfullly!");
      });
      // else if on root...
    } else {
      const oldName = path.join(rootDirPath, req.params.oldName);
      const newName = path.join(rootDirPath, dirName);
      fs.rename(oldName, newName, (err) => {
        if (err) throw err;
        console.log("directory name updated successfullly!");
      });
    }
    next();
  },

  updateFileName: (req, res, next) => {
    const fileName = req.body.newName;
    const rootDirPath = path.join(BASE_DIR, req.user.user_id.toString());
    const oldName = path.join(rootDirPath, req.params.oldName);
    const newName = path.join(rootDirPath, fileName);

    // If on subfolder...
    if (req.params.oldName.toString().includes("/")) {
      const oldName = path.join(rootDirPath, req.params.oldName.slice(7)); // to hardcoding remove "/upload"
      const fixedName = path.posix.dirname(oldName);
      const newName = path.join(fixedName, fileName);
      fs.rename(oldName, newName, (err) => {
        if (err) throw err;
        console.log("File name updated successfullly!");
      });
      // else if on root...
    } else {
      fs.rename(oldName, newName, (err) => {
        if (err) throw err;
        console.log("File name updated successfullly!");
      });
    }
    next();
  },
  deleteDir: (req, res, next) => {
    const rootDirPath = path.join(BASE_DIR, req.user.user_id.toString());
    let newDirPath = path.join(rootDirPath, req.params.dir);
    const referer = req.get("Referer");
    let subfolderPath;

    if (referer) {
      const url = new URL(referer);
      const match = url.pathname.match(/^\/upload(\/.*)?$/);

      subfolderPath = match && match[1] ? match[1] : "";
    }
    // if not on root
    if (
      typeof subfolderPath === "undefined" ||
      subfolderPath !== "" ||
      subfolderPath !== "/"
    ) {
      newDirPath = path.join(rootDirPath, req.params.dir.slice(7)); // to hardcoding remove "/upload");
    }

    try {
      fs.rm(newDirPath, { recursive: true }, (err) => {
        if (err) throw err;
        console.log("directory deleted successfullly!");
      });
      console.log("Directory deleted.");
      next();
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
  deleteFile: (req, res, next) => {
    const rootDirPath = path.join(BASE_DIR, req.user.user_id.toString());
    let newDirPath = path.join(rootDirPath, req.params.file);
    const referer = req.get("Referer");
    console.log("referer: ", referer);
    let subfolderPath;

    if (referer) {
      const url = new URL(referer);
      const match = url.pathname.match(/^\/upload(\/.*)?$/);

      subfolderPath = match && match[1] ? match[1] : "";
    }
    // if not on root
    if (
      typeof subfolderPath === "undefined" ||
      subfolderPath !== "" ||
      subfolderPath !== "/"
    ) {
      newDirPath = path.join(rootDirPath, req.params.file.slice(7)); // to hardcoding remove "/upload");
    }

    try {
      fs.unlink(newDirPath, (err) => {
        if (err) throw err;
        console.log("File deleted successfullly!");
      });
      console.log("File deleted.");
      next();
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  },
  dirDetails: async (req, res, next) => {
    const rootDirPath = path.join(BASE_DIR, req.user.user_id.toString());
    let newDirPath = path.join(rootDirPath, req.params.dir);
    const referer = req.get("Referer");
    let subfolderPath;
    let totalSize = 0;

    if (referer) {
      const url = new URL(referer);
      const match = url.pathname.match(/^\/upload(\/.*)?$/);

      subfolderPath = match && match[1] ? match[1] : "";
    }
    // if not on root
    if (
      typeof subfolderPath === "undefined" ||
      subfolderPath !== "" ||
      subfolderPath !== "/"
    ) {
      newDirPath = path.join(rootDirPath, req.params.dir.slice(7)); // to hardcoding remove "/upload");
    }

    try {
      const items = await fsPromise.readdir(newDirPath, {
        withFileTypes: true,
      });

      for (const item of items) {
        const itemPath = path.join(newDirPath, item.name);
        const stats = await fsPromise.stat(itemPath);

        if (item.isDirectory()) {
          totalSize += await getDirectorySize(itemPath); // recursive
        } else {
          totalSize += stats.size;
        }
      }
      req.totalSize = totalSize; //in bytes
      next();
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};

module.exports = fileManager;
