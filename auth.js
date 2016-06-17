/*
 * decoded-express-auth middleware
 *
 * Authentication middleware for Decoded's Express-based applications
 */

// passportjs and Auth0 custom passportjs auth strategy
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
// Session and cookies middlewares to keep user logged in
var cookieParser = require('cookie-parser');
var session = require('express-session');
// used for generating uuid for cookie secret
var uuid = require('node-uuid');

// global module default config object
var OPTIONS = {
  auth0: {
    domain: 'decoded.eu.auth0.com',
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: '/callback'
  },
  cookieSecret: uuid.v4(),
  successRedirect: '/',
  failureRedirect: '/'
};

var overrideOptions = function (overrides) {
  /*
   * Given an object of keys which should be replaced in the global config
   * object, replace these keys. Do this up to two levels' depth.
   */
  var keys = Object.keys(OPTIONS);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key in overrides) {
      if (typeof OPTIONS[key] === 'object') {
        var subKeys = Object.keys(OPTIONS[key]);
        for (var j = 0; j < subKeys.length; j++) {
          var subKey = subKeys[j];
          if (subKey in overrides[key]) {
            OPTIONS[key][subKey] = overrides[key][subKey];
          }
        }
      } else {
        OPTIONS[key] = overrides[key];
      }
    }
  }
}

// passportjs verify callback for the Auth0Strategy
var verifyCallback = function (
  accessToken, refreshToken, extraParams, profile, done
) {
  // accessToken is the token to call Auth0 API (not needed in the most cases)
  // extraParams.id_token has the JSON Web Token
  // profile has all the information from the user
  return done(null, profile);
}

// passportjs user serialisation/deserialisation functions
// This is not a best practice, but we want to keep things simple for now
var serializeUser = function (user, done) {
  done(null, user);
}

var deserializeUser = function (user, done) {
  done(null, user);
}

var authCallbackHandler = function (req, res) {
  if (!req.user) {
    throw new Error('user null');
  }
  res.redirect(OPTIONS.successRedirect);
}

/*
 * Call this once with your express app instance as the first argument and an
 * options object as the second. This will setup and initialise the middleware.
 */
exports.init = function (app, options) {
  // override any options that were specified
  overrideOptions(options);
  // build auth0 passportjs strategy
  var strategy = new Auth0Strategy(OPTIONS.auth0, verifyCallback);
  passport.use(strategy);
  // register passportjs serialisation/deserialisation functions
  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
  // register cookie and session middlewares
  app.use(cookieParser());
  app.use(
    session(
      {
        secret: OPTIONS.cookieSecret,
        resave: false,
        saveUninitialized: false
      }
    )
  );
  // register passportjs middlewares
  app.use(passport.initialize());
  app.use(passport.session());
  // create Auth0 callback handler
  app.get(
    OPTIONS.auth0.callbackURL,
    passport.authenticate(
      'auth0', { failureRedirect: OPTIONS.failureRedirect }
    ),
    authCallbackHandler
  );
}

// Use this middleware to protect one or more routes from access without auth
exports.requiresLogin = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect(OPTIONS.auth0.callbackURL);
  }
  next();
}
