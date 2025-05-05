const { body } = require("express-validator");

// Profile validator for creating new users.

const validateMembership = [
  body("membership")
    .exists()
    .withMessage("Membership type is required")
    .bail()
    .isIn(["admin", "member"])
    .withMessage("Membership type must be either 'admin' or 'member'"),
];

module.exports = { validateMembership };