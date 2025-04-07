const { body } = require("express-validator");
const db = require("../db/queries");

const validateEmail = [
  body("email")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .bail()
    .custom(async (value) => {
      const user = await db.checkExistingEmail(value);
      if (user.rows.length > 0) {
        throw new Error("Email address already in use.");
      }
      return true;
    })
    .withMessage("Email address already in use."),
];

module.exports = { validateEmail };
