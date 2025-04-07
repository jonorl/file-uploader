// controllers/mainController.js

const db = require("../db/queries");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { validationResult } = require("express-validator");

// Optional, load express to format dates
const moment = require("moment");
const { localsName } = require("ejs");

async function getIndex(req, res) {
  const board = await db.getAllUsernames();
  const modifiedBoard = board.map((obj) => ({
    ...obj,
    formattedDate: moment(obj.message_created_at).format("DD/MM/YY"),
    formattedTime: moment(obj.message_created_at).format("h:mm:ssa"),
  }));
  res.render("../views/index", {
    title: "Members Only",
    board: modifiedBoard,
    user: req.user,
  });
}

async function getLogin(req, res) {
  res.render("../views/login", { user: req.user });
}

async function getSignUp(req, res) {
  res.render("../views/sign-up", { user: req.user });
}

async function getNewMessage(req, res) {
  res.render("../views/new-message", {
    title: "New Message",
    user: req.user,
  });
}

async function getLogout(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
}

async function getProfile(req, res) {
  res.render("../views/profile", { user: req.user });
}

async function getDelete(req, res) {
  console.log(req.params.messageId);
  await db.deleteMessage(req.params.messageId);
  res.redirect("/");
}

async function postSignUp(req, res, next) {
  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const uniqueErrors = {};
    errors.array().forEach((error) => {
      if (!uniqueErrors[error.path]) {
        uniqueErrors[error.path] = error;
      }
      // Return to the sign-up page with error messages
    });

    return res.render("../views/sign-up", {
      errors: Object.values(uniqueErrors),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      user: req.user,
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = await db.insertNewUser(
      req.body.firstName,
      req.body.lastName,
      req.body.email,
      hashedPassword
    );

    // Automatically log the user in
    req.login(newUser, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/");
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

async function postLogin(req, res, next) {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/sign-up");
    }

    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }

      // Update created_at after successful login
      await db.updateCreatedAt(req.body.username);

      return res.redirect("/login");
    });
  })(req, res, next);
}

async function postNewMessage(req, res) {
  await db.insertMessage(req.user.email, req.body.title, req.body.message);
  res.redirect("/");
}

async function postProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const uniqueErrors = {};
    errors.array().forEach((error) => {
      if (!uniqueErrors[error.path]) {
        uniqueErrors[error.path] = error;
      }
    });
    // Return to the profile page with error messages
    return res.render("../views/profile", {
      errors: Object.values(uniqueErrors),
      user: req.user,
    });
  } else await db.updateRole(req.user.email, req.body.membership);
  res.redirect("/profile");
}

module.exports = {
  getIndex,
  getLogin,
  getSignUp,
  getLogout,
  getNewMessage,
  getProfile,
  getDelete,
  postSignUp,
  postLogin,
  postNewMessage,
  postProfile,
};
