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
  // begin private variables
  var _options = {
    auth0: {
      callbackURL: '/auth/callback'
    },
    cookieSecret: uuid.v4(),
    successRedirect: '/',
    failureRedirect: '/auth/failed',
    serializeUser: null,  // optional pointer to a callback function
    deserializeUser: null, // as above
    // if set to true, the library will automatically provide a failure route
    useDefaultFailureRoute: true
  };
  var strategy;
  // end private variables

  // begin private methods
  /*
   * This is called by module constructor and is used to load Auth0 config variables
   * from environment variables.
   */
  var loadConfig = function () {
    _options.auth0 = merge(
      _options.auth0,
      {
        domain: process.env.AUTH0_DOMAIN,
        clientID: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET
      }
    );
  };
  // passportjs verify callback for the Auth0Strategy
  var verifyCallback = function (
    accessToken, refreshToken, extraParams, profile, done
  ) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  };
  // passportjs default user serialisation/deserialisation functions
  // This is not a best practice, but we want to keep things simple for now
  var serializeUser = function (user, done) {
    done(null, user);
  };
  var deserializeUser = function (user, done) {
    done(null, user);
  };
  // the route handler for the auth0 callback
  var authCallbackHandler = function (req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
    res.redirect(_options.successRedirect);
  };
  // end private methods

  // begin public methods
  // Use this middleware to protect one or more routes from access without auth
  this.requiresLogin = function (req, res, next) {
    if (!req.isAuthenticated()) {
      return res.redirect(_options.auth0.callbackURL);
    }
    next();
  };
  // end public methods

  // begin constructor function proper
  // load options from environment variables
  loadConfig();
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
  // create passportjs/Auth0 failure route if requested
  if (_options.useDefaultFailureRoute) {
    app.get(
      _options.failureRedirect,
      function (req, res) {
        res.sendStatus(403);
      }
    )
  }
  // end constructor function proper
};
