// Load Router

const { Router } = require("express");
const mainController = require("../controllers/mainController");
const { validateUser } = require("../controllers/formValidation");
const { validateEmail } = require("../controllers/emailDuplicateValidation");
const { validateMembership } = require("../controllers/profileValidator");

const mainRouter = Router();

mainRouter.get("/", mainController.getIndex);

mainRouter.get("/login", mainController.getLogin);

mainRouter.get("/sign-up", mainController.getSignUp);

mainRouter.get("/new-message", mainController.getNewMessage)

mainRouter.get("/logout", mainController.getLogout)

mainRouter.get("/profile", mainController.getProfile)

mainRouter.get("/delete/:messageId", mainController.getDelete)

mainRouter.post("/sign-up", [...validateUser, ...validateEmail], mainController.postSignUp);

mainRouter.post("/login", mainController.postLogin);

mainRouter.post("/new-message", mainController.postNewMessage)

mainRouter.post("/profile", validateMembership, mainController.postProfile)

// Always export back to app.js at the end

module.exports = mainRouter;
