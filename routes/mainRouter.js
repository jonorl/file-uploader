// Load Router

const { Router } = require("express");
const mainController = require("../controllers/mainController");
const { validateUser } = require("../controllers/formValidation");
const { validateEmail } = require("../controllers/emailDuplicateValidation");
const { validateMembership } = require("../controllers/profileValidator");
const { upload } = require("../controllers/multer");
const { checkDirCloudinary } = require("../controllers/checkDir");
const cloudinaryFileManager = require("../controllers/cloudinary");
const { createShareLink, validateUUID, getShareLinkData } = require("../controllers/share");

const mainRouter = Router();

mainRouter.get("/", mainController.getIndex);

mainRouter.get("/login", mainController.getLogin);

mainRouter.get("/sign-up", mainController.getSignUp);

mainRouter.get("/new-message", mainController.getNewMessage);

mainRouter.get("/logout", mainController.getLogout);

mainRouter.get("/profile", mainController.getProfile);

mainRouter.get("/delete/:messageId(*)", mainController.getDelete);

mainRouter.get("/dir-new-name/:dir(*)", mainController.getDirEdit);

mainRouter.get("/file-new-name/:file(*)", mainController.getFileEdit);

mainRouter.get(
  "/dir-delete/:dir(*)",
  cloudinaryFileManager.folderDelete,
  mainController.getDel
);

mainRouter.get(
  "/file-delete/:file(*)",
  cloudinaryFileManager.fileDelete,
  mainController.getDel
);

mainRouter.get(
  "/upload/:subfolder(*)?",
  checkDirCloudinary,
  (req, res, next) => {
    if (req.params) {
      req.isNavigateUp = true;
    }
    next();
  },
  cloudinaryFileManager.read,
  mainController.getUpload
);

mainRouter.get(
  "/file-details/:file(*)",
  cloudinaryFileManager.fileDetails,
  mainController.getFileDetails
);

mainRouter.get("/dir-update/:dirName(*)", mainController.getDirUpdate);

mainRouter.get("/share/:folderName(*)", mainController.getShare);

mainRouter.get("/share-link/:uuid", validateUUID, getShareLinkData, mainController.getShareLink);

mainRouter.post(
  "/sign-up",
  [...validateUser, ...validateEmail],
  mainController.postSignUp
);

mainRouter.post("/login", mainController.postLogin);

mainRouter.post("/new-message", mainController.postNewMessage);

mainRouter.post("/profile", validateMembership, mainController.postProfile);

mainRouter.post(
  "/upload",
  checkDirCloudinary,
  upload,
  cloudinaryFileManager.create,
  mainController.postUpload
);

mainRouter.post(
  "/upload/:subfolder(*)",
  upload,
  cloudinaryFileManager.create,
  mainController.postUpload
);

mainRouter.post(
  "/newDir/:subfolder(*)",
  cloudinaryFileManager.folderCreate,
  mainController.postNewDir
);

mainRouter.post(
  "/dir-new-name/:oldName(*)/",
  cloudinaryFileManager.folderRename,
  mainController.postDirEdit
);

mainRouter.post(
  "/file-new-name/:oldName(*)/",
  cloudinaryFileManager.fileRename,
  mainController.postDirEdit
);

mainRouter.post("/share/:subfolder(*)", createShareLink, getShareLinkData, mainController.postShare);

mainRouter.post("/share-link/:subfolder(*)", createShareLink, getShareLinkData, mainController.postShare);


// Always export back to app.js at the end

module.exports = mainRouter;
