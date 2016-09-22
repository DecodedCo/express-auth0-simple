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
// for overriding options object
var merge = require('merge');

/*
 * Main prototype constructor
 * Call this once with your express app instance as the first argument and an
 * options object as the second. This will setup and initialise one instance of
 * the middleware.
 */
module.exports = function(app, options) {
  // define private variables
  var _options = {
    auth0: {
      callbackURL: '/auth/callback'
    },
    cookieSecret: uuid.v4(),
    successRedirect: '/',
    failureRedirect: '/',
    serializeUser: null,
    deserializeUser: null
  };
  var strategy;

  // reload options from environment variables
  reloadConfig(false);

  // override any options that were specified
  if (options) {
    _options = merge.recursive(_options, options);
  }

  // build auth0 passportjs strategy
  strategy = new Auth0Strategy(_options.auth0, verifyCallback);
  passport.use(strategy);
  // register passportjs serialisation/deserialisation functions
  passport.serializeUser(_options.serializeUser || serializeUser);
  passport.deserializeUser(_options.deserializeUser || deserializeUser);
  // register cookie and session middlewares
  app.use(cookieParser());
  app.use(
    session(
      {
        secret: _options.cookieSecret,
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
    _options.auth0.callbackURL,
    passport.authenticate(
      'auth0', { failureRedirect: _options.failureRedirect }
    ),
    authCallbackHandler
  );

  // public methods
  return {
    /*
     * This is called by module constructor and is used to load Auth0 config variables
     * from environment variables. You can also call it yourself if you want.
     * By default, this doesn't override variables that already exit, but you
     * can optionally tell it to override all variables with the environment ones
     * if you want, with the sole function argument.
     */
    reloadConfig: function (override) {
      if (override) {
        _options.auth0 = merge(
          _options.auth0,
          {
            domain: process.env.AUTH0_DOMAIN,
            clientID: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET
          }
        );
      } else {
        if (!_options.auth0.domain) {
          _options.auth0.domain = process.env.AUTH0_DOMAIN;
        }
        if (!_options.auth0.clientID) {
          _options.auth0.clientID = process.env.AUTH0_CLIENT_ID;
        }
        if (!_options.auth0.clientSecret) {
          _options.auth0.clientSecret = process.env.AUTH0_CLIENT_SECRET;
        }
      }
    },
    // passportjs verify callback for the Auth0Strategy
    verifyCallback: function (
      accessToken, refreshToken, extraParams, profile, done
    ) {
      // accessToken is the token to call Auth0 API (not needed in the most cases)
      // extraParams.id_token has the JSON Web Token
      // profile has all the information from the user
      return done(null, profile);
    },
    // passportjs default user serialisation/deserialisation functions
    // This is not a best practice, but we want to keep things simple for now
    serializeUser: function (user, done) {
      done(null, user);
    },
    deserializeUser: function (user, done) {
      done(null, user);
    },
    // the route handler for the auth0 callback
    authCallbackHandler: function (req, res) {
      if (!req.user) {
        throw new Error('user null');
      }
      res.redirect(OPTIONS.successRedirect);
    },
    requiresLogin: function (req, res, next) {
      if (!req.isAuthenticated()) {
        return res.redirect(OPTIONS.auth0.callbackURL);
      }
      next();
    }
  };
};
