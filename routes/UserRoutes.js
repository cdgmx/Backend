const express = require('express');
const  {registerUser, authUser, getUsers, getUserById, logoutUser}  = require('../controllers/UserControllers')
const { protect } = require("../middlewares/AuthMiddleware");

const router = express.Router()

router.route('/').post(registerUser);
router.route('/login').post(authUser);
router.route('/logout').delete(logoutUser)

module.exports = router;