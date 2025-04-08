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
    try {
      const fullPath = getPath(req);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        // If it's a directory, just read the directory items
        const items = fs.readdirSync(fullPath);
        req.directories = { type: "directory", items };

        // Don't try to read the directory as a file
        req.files = { type: "file", content: null };
        next();
      }
      //   } else {
      //     // If it's a file, read the file content
      //     const content = fs.readFileSync(fullPath, "utf8");
      //     req.files = { type: "file", content };
      //     req.directories = { type: "directory", items: [] };
      //     next();
      //   }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = fileManager;
