## Metadatum Obscura
The code uses Oauth to authenticate with Spotify's APIs and provides a basic framework and UI to query it.

## Using the code
As it is, there is a keys.js file that contains the public and private API keys.
That file is not committed to the git repo as it is specfic to the app implementation.
If you would like to use the code you will need to make the keys.js file.
To do this you will need to create an app here: `https://beta.developer.spotify.com/dashboard/applications`
That will allow you to generate a 'Client ID' and a 'Client Secret'. Be sure also to set a callback URI.
This file needs to export your keys labeled as in the example below (do this however you want):

*keys.js*

    module.exports = Object.freeze({
        client_id: 'yourClientIdHere',
        client_secret: 'yourClientSecretHere',
        redirect_uri: 'http://localhost:8080/callback'
    });

Make sure to not place this file in a publically accessible location in your file tree and do not commit to public repos unless you encrypt it as it contains your private API key.

## Running the code
First run the app.js file:

    $ node app.js

Then, open `http://localhost:8080` in a browser.

## Other
A comprehensive API reference can be found here: `https://beta.developer.spotify.com/documentation/web-api/reference/`