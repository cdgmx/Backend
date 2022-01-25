const User = require("../models/UserModel");
const AsyncHandler = require("express-async-handler");
const generateToken = require("../utils/GenerateToken");
const { serialize } = require("cookie");
const jsend = require("jsend");

//Handles the user registration
const registerUser = AsyncHandler(async (req, res) => {
  const { first_name, last_name, email_address, password } =
    req.body;

  const user_exists = await User.findOne({ email_address });

  //Check if the user exists from the database
  if (user_exists) {
    res.status(400);
    throw new Error("User Already Exists");
  }

  //Create the user
  const user = await User.create({
    first_name,
    last_name,
    email_address,
    password,
  });

  //If the user is recieved from the database
  if (user) {
    res.status(201).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email_address: user.email_address,
      is_admin: user.is_admin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Error Occurred");
  }

  //Response from the API if the user is successfully registered
  res.json({
    first_name,
    last_name,
    email_address,
  });
});

//Handles the user login
const authUser = AsyncHandler(async (req, res) => {
  const { first_name, last_name, email_address, password, } =
    req.body;

  //Check if the user exists and store it
  console.log("email_address", email_address);
  const user = await User.findOne({ email_address });
  //Check if the password matches the user
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email_address: user.email_address,
      is_admin: user.is_admin,
      token: generateToken(user._id),
    });
  } else {
    console.log("user", user);
    res.status(400);
    throw new Error("Invalid Email or Password!");
  }
});



const logoutUser = AsyncHandler(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    expires: 0,
    sameSite: process.env.cookie_samesite, // strict
    domain: process.env.cookie_domain, // your domain
    secure: process.env.cookie_secure // true
};

// set to empty 
    const tokenCookie = await serialize('token', '', cookieOptions);

    res.setHeader('Set-Cookie', [tokenCookie]);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(jsend.success(true));
    });


module.exports = { registerUser, authUser, logoutUser};
