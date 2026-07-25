const bcrypt = require("bcrypt");
const { createUser, findUserByEmail } = require("../models/userModel");

function getSignup(req, res) {
  res.render("signup", { error: null });
}

async function postSignup(req, res) {
  const { email, password } = req.body;
  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.render("signup", { error: "An account with that email already exists." });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await createUser(email, hash);

    req.login(user, (err) => {
      if (err) return res.render("signup", { error: "Something went wrong. Try again." });
      res.redirect("/dashboard");
    });
  } catch (err) {
    console.error(err);
    res.render("signup", { error: "Something went wrong. Try again." });
  }
}

function getLogin(req, res) {
  res.render("login", { error: null });
}

function logout(req, res) {
  req.logout((err) => {
    if (err) console.error(err);
    res.redirect("/login");
  });
}

module.exports = { getSignup, postSignup, getLogin, logout };
