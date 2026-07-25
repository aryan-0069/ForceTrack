require("dotenv").config();
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const passport = require("./config/passport");
const pool = require("./config/db");
const { startCron } = require("./jobs/syncCron");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", "./views");

// Body parsing + static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Sessions (stored in PostgreSQL so they survive server restarts)
app.use(
  session({
    store: new pgSession({ pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  })
);

// Passport auth
app.use(passport.initialize());
app.use(passport.session());

// Make `user` available in all views without passing it manually every time
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
app.get("/", (req, res) => res.render("index"));
app.use("/", authRoutes);
app.use("/", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startCron();
});
