# express-auth0-simple
Simple authentication middleware for integrating Auth0 with Express-based applications.

## About
This NodeJS package abstracts away most of the boilerplate code needed to integrate a NodeJS web application with the oauth authentication provider [Auth0](https://auth0.com/).

The code is based on Auth0's own setup guide and should work fine with any application using versions of the Express framework in the **4.x.x** version range.

This package is written in ES6 but transpiles down to ES5 or whatever subset of ES6 your runtime supports at installation time.

## Setup
Here is a quickstart guide on how to setup this middleware.

### Install Package

Add this package to your NodeJS project:

```sh
npm install --save express-auth0-simple
```

### Use Package
The package is typically used wherever you configure your express middleware (becase that's what it is). This is normally in the main `index.js` file for small projects.

#### Add dependencies
For this middleware to work you'll need to make sure your express app has session and cookie functionality. You might have this functionality already, but if not you can use these middleware to provide this:

- `cookie-parser` (we've tested against version `1.4.x`)
- `express-session` (we've tested against version `1.13.x`)

- You'll also need to install passport-js (`passport`, we've tested against version `0.3.x`)

### Configure Auth0

So that your app can authenticate with Auth0, you'll need to provide your Auth0 client credentials. You need to provide your **Auth0 Client ID**, your **Auth0 Client Secret** and your **Auth0 Domain**. These values differ from app to app and you can find the values for your app in its settings page in the dashboard.

The easiest secure way of supplying these credentials to your app is via environment variables and this package will do that by default. Make sure the following environment variables have been set and are accessible to the process running the app:

```env
AUTH0_CLIENT_ID='your_client_id'
AUTH0_CLIENT_SECRET='your_client_secret'
AUTH0_DOMAIN='companyltd.eu.auth0.com'
```

You can also set these values via the `auth0Options` argument of the middleware constructor, but if you are doing this it is _highly recommended_ that these are not stored in source code.

You'll also need to set your client's `callbackURL`. This is not automatically loaded by default, so you'll have to pass this yourself in the `auth0Options` argument of the middleware constructor, along with any other additional options supported by Auth0.

#### Import it

```js
// ES5
var expressAuth0Simple = require('express-auth0-simple');
var passport = require('passport');
// you might need these middleware aswell
var cookieParser = require('cookie-parser');
var session = require('express-session');
```

```js
// ES6
import ExpressAuth0Middleware from 'express-auth0-simple';
import passport from 'passport';
// you might need these middleware aswell
import cookieParser from 'cookie-parser';
import session from 'express-session';
```

### Configure dependent middleware

```js
// register cookie and session middlewares
app.use(cookieParser());
app.use(
  session(
    {
      secret: uuid.v4(),
      resave: false,
      saveUninitialized: false
    }
  )
);
// register passportjs middlewares
app.use(passport.initialize());
app.use(passport.session());
```

#### Instantiate it
Make sure your Auth0 environment variables are set before you do this, or provide the Auth0 config as arguments to the middleware constructor.

```js
// ES5
var auth = new expressAuth0Simple.ExpressAuth0Middleware(
  { callbackURL: '/auth/callback' }
);
```

```js
// ES6
let auth = new ExpressAuth0Middleware(
  { callbackURL: '/auth/callback' }
);
```

#### Enable it
Attach the Auth0 callback handler to whatever route you'd like this to be mounted on.

```js
// this is the login route
app.get('/auth/callback', auth.authCallbackMiddleware, auth.authCallbackHandler);
```

#### Protect your stuff
You can either protect your whole app from unauthenticated access or just specific routes:

```js
// any additional routes declared below this point require login to access
app.use(auth.requiresLogin);
```

_OR_

```js
// only this route requires login to access
app.get(
  '/my-fab-route',
  auth.requiresLogin,
  function(req,res) {
    res.send('This is publicly accessible');
  }
);
```

### Logout
You can log out an authenticated user during any request by calling `req.logout()`

### Additional Config
The middleware constructor also supports a second argument, which if provided should be an object with either of the following keys:

- `loginPath` - the URL a user goes to to login (this is set to the Auth0 callback URL by default but can be changed if needed). Unauthenticated requests to protected routes will be redirected to this URL, so make sure it's correct if you override it.
- `failurePath` - the URL a user is redirected to if their authentication attempt fails. This is also set to the Auth0 callback URL by default. Unlike `loginPath`, changing it will not cause any problems as long as the page redirected to is publicly accessible. This can be used for you to show a custom 'forbidden' page.
