const { v2: cloudinary } = require("cloudinary");

// This function adds a folder based on the user ID to make it act as a "root".

async function checkDirCloudinary(req, res, next) {
  try {
    const user = req.user.user_id;
    if (user) {
      const rootFolder = await cloudinary.api.sub_folders("");
      const exists = rootFolder.folders.some((folder) => folder.name === user);
      if (!exists) {
        await cloudinary.api.create_folder(user);
      }
    }
    next();
  } catch (error){
    console.error("Error in Cloudinary:", error);
    next(error);
  }
}

module.exports = { checkDirCloudinary };
