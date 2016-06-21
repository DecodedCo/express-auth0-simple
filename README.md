# decoded-express-auth
Authentication middleware for Decoded's Express-based applications

## About
This NodeJS package abstracts away the boilerplate code needed to integrate a NodeJS web application with [Auth0](https://auth0.com/).
The code is based on Auth0's own setup guide and should work fine with any application using versions of the Express framework in the **4.x.x** version range.

## Setup
Here is a quickstart guide on how to setup this middleware.

### Install Package

Run this command within an existing node project with a `package.json` file to install the package as a dependency of your project.

```sh
npm install --save git+ssh://git@github.com:DecodedCo/decoded-express-auth.git
```

> **Pro Tip:** Omit the `--save` option if you just want to install the package without adding it as a dependency.

Or alternatively, add this line to the `dependencies` section of your `package.json` file:

```json
"decoded-express-auth": "git+ssh://git@github.com/DecodedCo/decoded-express-auth.git#develop"
```

### Use Package

Having installed the package and/or added it as a dependency to your project, you'll now need to add the following lines to the main file of your app:

```js
// You'll probably want to require() other dependencies like express first, above this line...

var decodedAuth = require('decoded-express-auth'); // Import the middleware library

// inititalise decodedAuth
decodedAuth.init(
  app, // Pass in your express app instance here
  {
    failureRedirect: '/failed' // Pass in any other config options here, these are explained below
  }
);
```

Use the `requiresLogin` middleware provided by this app whenever you have one or more URL routes you want to be protected behind Auth0 authentication. Attempting to access any of the routes using this middleware will redirect the user to Auth0 to login first before allowing them to continue:

```js
// Any URL route defined after this point will require authentication
app.use(decodedAuth.requiresLogin);
```

OR:

```js
// Here it is used as a per-route middleware to protect only this URL route
app.get('/my-fab-route', decodedAuth.requiresLogin, function(req,res) {
  res.send('My route rocks! 🐸 💜');
})
```
