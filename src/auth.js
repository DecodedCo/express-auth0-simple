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
// for overriding options object
import merge from 'merge';
// passportjs
import passport from 'passport';


// this is a bit of a hack to allow private attributes in ES6 classes
let _private = {};
for (const item of ['auth0Options', 'options', 'requiresLogin', 'strategy']) {
  _private[item] = Symbol(item);
}

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

  // used for the login/callback route
  get authCallbackMiddleware () {
    return passport.authenticate(
      'auth0',
      { failureRedirect: this[_private.options].failurePath }
    );
  };

  // this is the login/callback route
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

  // returns the middeware method for ensuring requests are logged in
  get requiresLogin () {
    return this[_private.requiresLogin].bind(this);
  };

  /*
   * this is the middleware for ensuring a request is logged in
   * it's private because it can't be used directly, as express clears the
   * value of the `this` pointer when mounting it as middleware.
   * To get around this, one has to refer to it with function.prototype.bind()
   * to ensure the value of `this` refers to this class instance, so we wrap
   * this functionality in a getter method so the user doesn't notice.
   */
  [_private.requiresLogin] (req, res, next) {
    if (!req.isAuthenticated()) {
      // store requested URL for redirecting back to when authenticated
      req.session.nextUrl = req.originalUrl;
      return res.redirect(this[_private.options].loginPath);
    } else {
      next();
    }
  };
};
