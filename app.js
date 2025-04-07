// Load .env with path, API keys and other secrets
require("dotenv").config();

// Load Express and path
const express = require("express");
const session = require("express-session");
const app = express();
const path = require("node:path");

// Passport and hashing libs for user authentication
const bcrypt = require("bcryptjs");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("./db/queries");

// Load Routers
const mainRouter = require("./routes/mainRouter");

// Add this code to make it possible to render .ejs files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


// Passport config
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await db.serialise(username);
      const user = rows[0];
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password" });
      }
      db.incrementVisits(user.user_id)
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, { id: user.user_id, email: user.email, role: user.role});
});

passport.deserializeUser(async (data, done) => {
  try {
    const { rows } = await db.deserialise(data.id);
    const user = rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Express session config

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());

// "locals" initialisation

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Add this code to make it possible to load css
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

// Add this code to parse data to POST requests
app.use(express.urlencoded({ extended: true }));

// Set port to whatever is on .env otherwise use 3000
const PORT = process.env.PORT || 3000;

app.use("/", mainRouter);

// Message in the console to confirm that the server launched correctly
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});
