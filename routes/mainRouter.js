// Load Router

const { Router } = require("express");
const mainController = require("../controllers/mainController");
const { validateUser } = require("../controllers/formValidation");
const { validateEmail } = require("../controllers/emailDuplicateValidation");
const { validateMembership } = require("../controllers/profileValidator");
const { upload } = require("../controllers/multer")
const { checkDir } = require("../controllers/checkDir")
const fileManager = require("../controllers/CRUD")

const mainRouter = Router();

mainRouter.get("/", mainController.getIndex);

mainRouter.get("/login", mainController.getLogin);

mainRouter.get("/sign-up", mainController.getSignUp);

mainRouter.get("/new-message", mainController.getNewMessage)

mainRouter.get("/logout", mainController.getLogout)

mainRouter.get("/profile", mainController.getProfile)

mainRouter.get("/delete/:messageId", mainController.getDelete)

mainRouter.get("/upload", checkDir, fileManager.read, mainController.getUpload)

mainRouter.get("/dir-new-name/:dir", mainController.getDirEdit)

mainRouter.get("/file-new-name/:file", mainController.getFileEdit)

mainRouter.get("/dir-delete/:dir", fileManager.deleteDir, mainController.getDirDel)

mainRouter.post("/sign-up", [...validateUser, ...validateEmail], mainController.postSignUp);

mainRouter.post("/login", mainController.postLogin);

mainRouter.post("/new-message", mainController.postNewMessage)

mainRouter.post("/profile", validateMembership, mainController.postProfile)

mainRouter.post("/upload", checkDir, upload, mainController.postUpload);

mainRouter.post("/newDir", fileManager.create, mainController.postNewDir)

mainRouter.post("/dir-new-name/:oldName/", fileManager.updateDirName, mainController.postDirEdit)

mainRouter.post("/file-new-name/:oldName/", fileManager.updateFileName, mainController.postDirEdit)

// Always export back to app.js at the end

module.exports = mainRouter;
