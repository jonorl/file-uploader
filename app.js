// Load .env with path, API keys and other secrets
require("dotenv").config();

// Load Express and path
const express = require("express");
const session = require("express-session");
const app = express();
const path = require("node:path");

// Prisma config
const { PrismaClient } = require('@prisma/client');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prisma = new PrismaClient();

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

// Test Raw SQL vs Prisma

// const pool = require("./db/pool");
// async function getAllUsernames() {
//   function arraysAreEqualEvery(arr1, arr2) {
//     // Check lengths AND use every()
//     return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
//   }

//   const { rows } = await pool.query("SELECT * FROM board");
//   const prismaRows = await prisma.board.findMany();

//   console.log("SQL rows: ", rows)
//   console.log("Prisma rows: ", prismaRows)
  
//   console.log(arraysAreEqualEvery(rows, prismaRows));
//   return rows;
// }
// getAllUsernames();

// Passport config
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await db.serialise(username);
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
    const rows = await db.deserialise(data.id);
    const user = rows;
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Express session config

app.use(session({
  cookie: {
   maxAge: 7 * 24 * 60 * 60 * 1000 // ms
  },
  secret: 'mahSecretWard',
  resave: true,
  saveUninitialized: true,
  store: new PrismaSessionStore(
    new PrismaClient(),
    {
      checkPeriod: 2 * 60 * 1000,  //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }
  )
})
);
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

// Make the uploads folder static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set port to whatever is on .env otherwise use 3000
const PORT = process.env.PORT || 3000;

app.use("/", mainRouter);

// Message in the console to confirm that the server launched correctly
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});
