/* eslint-disable prefer-destructuring */
const bcrypt = require('bcryptjs');
const express = require('express');
//const fs = require('fs');
const path = require('path');
const User = require('../model/user');
const { passport } = require('../app');
//const { parser } = require('../app');
const { checkAuthenticated } = require('../app');
const { checkNotAuthenticated } = require('../app');
const { sendDatabaseErrorResponse } = require('../app');
const {
  checkAndSanitizeInput,
  handleInputCheck,
} = require('../app');
const { Strategy } = require('passport');

const router = express.Router();

router.post('/Register', 
checkNotAuthenticated,
  checkAndSanitizeInput(),
  handleInputCheck,
  async (req, res) => {
    // console.log(1);
    console.log("req body: ",req.body);
    const  email  = req.body.email;
    const  username  = req.body.username;
    const password  = req.body.password;
    const registrationDate = Date.now();


    try {
      // console.log(2);
      const hashedPassword = await bcrypt.hash(password, 10);

      User.findOne({ email })
        .then((userFoundByEmail) => {
          if (userFoundByEmail) {
            res.status(409);
            res.json(`[!] Email address is already in use: ${email}`);
          } else {
            User.findOne({ username })
              .then((userFoundByUsername) => {
                if (userFoundByUsername) {
                  res.status(409);
                  res.json(`[!] Username is already in use: ${username}`);
                } else {
                  // console.log(3);
                  const newUser = new User({
                    email,
                    username,
                    password: hashedPassword,
                    registration_date:registrationDate
                  });
                  newUser.save()
                    .then(() => res.sendStatus(201))
                    .catch((err) => sendDatabaseErrorResponse(err, res));
                }
              });
          }
        });
    } catch (err) {
      // console.log(4);
      res.status(559).json(`[!] Could not register user: ${err}`);
    }
  });

router.post('/login',
  checkNotAuthenticated,
  passport.authenticate('local'),
  (req, res) => {
    console.log(1);
    res.sendStatus(200);
  },
  (req, res) => {
    console.log(2);
    res.status(401);
    res.json('[!] Invalid credentials');
  });

router.post('/logout', checkAuthenticated, (req, res) => {
  req.logout();
  res.sendStatus(200);
});

router.get('/checkAuthen', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

module.exports = router;