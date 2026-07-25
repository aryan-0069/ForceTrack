const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../config/ensureAuth");
const userController = require("../controllers/userController");

router.get("/dashboard", ensureAuthenticated, userController.getDashboard);
router.get("/add-platform", ensureAuthenticated, userController.getAddPlatform);
router.post("/add-platform", ensureAuthenticated, userController.postAddPlatform);

module.exports = router;
