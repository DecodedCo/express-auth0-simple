/*
 * express-auth0-simple
 *
 * Simple authentication middleware for integrating Auth0 with Express-based
 * applications.
 *
 *
 * Copyright (c) 2016, 2017 Decoded Ltd.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Auth0 custom passportjs auth strategy
import Auth0Strategy from 'passport-auth0';
// cookie middleware for keeping user logged in
import cookieParser from 'cookie-parser';
// for overriding options object
import merge from 'merge';
// passportjs
import passport from 'passport';
// Session middleware for keeping user logged in
import session from 'express-session';
// used for generating uuid for cookie secret
import uuid from 'uuid';


let _private = {};
['auth0Options', 'options', 'strategy'].each((item) => {
  _private[item] = Symbol(item);
});

export class ExpressAuth0Middleware {
  constructor (auth0Options={}, options={}) {
    this[_private.auth0Options] = merge(
      ExpressAuth0Middleware.defaultAuth0Options,
      auth0Options
    );
    this[_private.options] = merge.recursive(
      ExpressAuth0Middleware.defaultOptions,
      options
    );
    this[_private.strategy] = new Auth0Strategy(
      this[_private.auth0Options],
      this.verifyCallback
    );
    // build and bind Auth0 passportjs strategy
    passport.use(this.strategy);
    passport.serializeUser(this.serializeUser);
    passport.deserializeUser(this.deserializeUser);
  };

  static get defaultAuth0Options () {
    return {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
    };
  };

  static get defaultOptions () {
    return {
      loginPath: '/auth/login',
      failurePath: '/auth/login',
    };
  };

  verifyCallback (accessToken, refreshToken, extraParams, profile, done) {
    /*
     * accessToken is the token to call Auth0 API (not needed in the most cases)
     * extraParams.id_token has the JSON Web Token profile has all the
     * information from the user
     */
    return done(null, profile);
  };

  get strategy () {
    return this[_private.strategy];
  };

  serializeUser (user, done) {
    done(null, user);
  };

  deserializeUser (user, done) {
    done(null, user);
  };

  get authCallbackMiddleware () {
    return passport.authenticate(
      'auth0',
      { failureRedirect: this[_private.options].failurePath }
    );
  };

  authCallbackHandler (req, res) {
    if (!req.user) {
      throw new Error('user null');
    } else {
      // redirect to previously-requested URL if stored in session
      const redirectTo = req.session.nextUrl || '/';
      delete req.session.nextUrl;
      return res.redirect(redirectTo);
    }
  };

  requiresLogin (req, res, next) {
    if (!req.isAuthenticated()) {
      // store requested URL for redirecting back to when authenticated
      req.session.nextUrl = req.originalUrl;
      return res.redirect(this[_private.options].loginPath);
    } else {
      next();
    }
  };
};

/*
 * Main prototype constructor
 * Call this once with your express app instance as the first argument and an
 * options object as the second. This will setup and initialise one instance of
 * the middleware.
 */
// module.exports = function(app, options) {
//   // begin private variables
//   var _options = {
//     auth0: {
//       callbackURL: '/auth/callback'
//     },
//     cookieSecret: uuid.v4(),
//     successRedirect: '/',
//     failureRedirect: '/auth/failed',
//     serializeUser: null,  // optional pointer to a callback function
//     deserializeUser: null, // as above
//     // if set to true, the library will automatically provide a failure route
//     useDefaultFailureRoute: true
//   };
//   var strategy;
//   // end private variables

//   // begin private methods
//   /*
//    * This is called by module constructor and is used to load Auth0 config
//    * variables from environment variables.
//    */
//   var loadConfig = function () {
//     _options.auth0 = merge(
//       _options.auth0,
//       {
//         domain: process.env.AUTH0_DOMAIN,
//         clientID: process.env.AUTH0_CLIENT_ID,
//         clientSecret: process.env.AUTH0_CLIENT_SECRET
//       }
//     );
//   };
//   // passportjs verify callback for the Auth0Strategy
//   var verifyCallback = function (
//     accessToken, refreshToken, extraParams, profile, done
//   ) {
//     // accessToken is the token to call Auth0 API (not needed in the most
//     // cases)
//     // extraParams.id_token has the JSON Web Token
//     // profile has all the information from the user
//     return done(null, profile);
//   };
//   // passportjs default user serialisation/deserialisation functions
//   // This is not a best practice, but we want to keep things simple for now
//   var serializeUser = function (user, done) {
//     done(null, user);
//   };
//   var deserializeUser = function (user, done) {
//     done(null, user);
//   };
//   // the route handler for the auth0 callback
//   var authCallbackHandler = function (req, res) {
//     if (!req.user) {
//       throw new Error('user null');
//     }
//     res.redirect(_options.successRedirect);
//   };
//   // end private methods

//   // begin public methods
//   // Use this middleware to protect one or more routes from access without auth
//   this.requiresLogin = function (req, res, next) {
//     if (!req.isAuthenticated()) {
//       return res.redirect(_options.auth0.callbackURL);
//     }
//     next();
//   };
//   // end public methods

//   // begin constructor function proper
//   // load options from environment variables
//   loadConfig();
//   // override any options that were specified
//   if (options) {
//     _options = merge.recursive(_options, options);
//   }
//   // build auth0 passportjs strategy
//   strategy = new Auth0Strategy(_options.auth0, verifyCallback);
//   passport.use(strategy);
//   // register passportjs serialisation/deserialisation functions
//   passport.serializeUser(_options.serializeUser || serializeUser);
//   passport.deserializeUser(_options.deserializeUser || deserializeUser);
//   // register cookie and session middlewares
//   app.use(cookieParser());
//   app.use(
//     session(
//       {
//         secret: _options.cookieSecret,
//         resave: false,
//         saveUninitialized: false
//       }
//     )
//   );
//   // register passportjs middlewares
//   app.use(passport.initialize());
//   app.use(passport.session());
//   // create Auth0 callback handler
//   app.get(
//     _options.auth0.callbackURL,
//     passport.authenticate(
//       'auth0', { failureRedirect: _options.failureRedirect }
//     ),
//     authCallbackHandler
//   );
//   // create passportjs/Auth0 failure route if requested
//   if (_options.useDefaultFailureRoute) {
//     app.get(
//       _options.failureRedirect,
//       function (req, res) {
//         res.sendStatus(403);
//       }
//     )
//   }
//   // end constructor function proper
// };
