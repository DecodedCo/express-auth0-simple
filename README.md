# decoded-express-auth
Authentication middleware for Decoded's Express-based applications

## About
This NodeJS package abstracts away the boilerplate code needed to integrate a NodeJS web application with the oauth authentication provider [Auth0](https://auth0.com/).
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
decodedAuth.init(app); // Pass in your express app instance here
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

## Configuration

### Environment Variables

So that your app can authenticate with Auth0, you'll need to provide your Auth0 account credentials. You need to provide your **Auth0 Client ID**, your **Auth0 Client Secret** and your **Auth0 Domain**. These values differ from app to app and you can find the values for your app in its settings page in the dashboard.

The best way of supplying these credentials to your app is via environment variables and this package will do that by default. Make sure the following environment variables have been set and are accessible to the process running the app:

```sh
export AUTH0_CLIENT_ID='your_client_id';
export AUTH0_CLIENT_SECRET='your_client_secret';
export AUTH0_DOMAIN='companyltd.eu.auth0.com';
```

If you **really need to**, you can set these values via the options argument when initialising the middleware, but if you are doing this, you **MUST** make sure that these are not stored in source code!

### Options Object

When initialising the middleware, you can optionally provide a second argument to the `init()` function - this should be an object. This can include options that override some configuration parameters of the middleware.

The options are:

| Key                  | Type                               | Description                                                                                                                                                                  |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth0`              | **Object**                         | Defines options that are passed directly into `passport-auth0`, these are described below                                                                                    |
| `auth0.domain`       | **String**                         | The domain configured in your Auth0 Dashboard. Normally in the format `<domain>.<region>.auth0.com`                                                                          |
| `auth0.clientID`     | **String**                         | Client ID as shown in your Auth0 Dashboard                                                                                                                                   |
| `auth0.clientSecret` | **String**                         | Client Secret as shown in your Auth0 Dashboard                                                                                                                               |
| `auth0.callbackURL`  | **String**                         | URL that your application uses to receive the OAuth callback from Auth0. This library will create an express route at that URL for you (Must match value in Auth0 Dashboard) |
| `cookieSecret`       | **String** OR **Array of Strings** | See https://github.com/expressjs/session#secret for more info                                                                                                                |
| `successRedirect`    | **String**                         | A URL to redirect to on successful Authentication                                                                                                                            |
| `failureRedirect`    | **String**                         | A URL to redirect to on failed Authentication                                                                                                                                |

Shown here is a full options object with every key populated, but note that each key is optional and will take the default for that argument if not given:

```js
var options = {
  auth0: {
    domain: 'yourdomain.eu.auth0.com', // this can be found in your Auth0 dashboard/app config
    clientID: 'client_id_super_secret', // same as above
    clientSecret: 'client_secret_super_super_secret!', // same as above
    callbackURL: '/callback' // this can be customised and must match what is set in Auth0
  },
  // You won't need to override this for most purposes (default is a random uuid)
  cookieSecret: 'cookiesRkuhl',
  successRedirect: '/', // URL to redirect to on successful authentication
  failureRedirect: '/auth-fail' // URL to redirect to on failed authentication
}
```
