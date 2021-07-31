var express = require('express') //Express web server framework
var request = require('request') //http Request library
var querystring = require('querystring') //node querystring module
var cookieParser = require('cookie-parser') //Cookie management
var keys = require('./keys') //Imports key variables, consult README

//Generates a random string of characters
var generateRandomString = function (length) {
  var text = ''
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

var stateKey = 'spotify_auth_state'
var app = express()

app.use(express.static(__dirname + '/public')).use(cookieParser())

app.get('/login', function (req, res) {
  //Generate state key
  var state = generateRandomString(16)
  res.cookie(stateKey, state)

  //Authorization request scope
  var scope = 'user-read-private '
  scope += 'user-read-email '
  scope += 'user-top-read '
  scope += 'user-library-read '
  scope += 'user-read-birthdate '
  scope += 'user-read-recently-played '
  scope += 'playlist-read-collaborative '
  scope += 'playlist-read-private'

  res.redirect(
    'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: keys.client_id,
      scope: scope,
      redirect_uri: keys.redirect_uri,
      state: state,
    })
  )
})

app.get('/callback', function (req, res) {
  //Request tokens
  var code = req.query.code || null
  var state = req.query.state || null
  var storedState = req.cookies ? req.cookies[stateKey] : null

  if (state === null || state !== storedState) {
    res.redirect(
      '/#' +
      querystring.stringify({
        error: 'state_mismatch',
      })
    )
  } else {
    res.clearCookie(stateKey)
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: keys.redirect_uri,
        grant_type: 'authorization_code',
      },
      headers: {
        Authorization: 'Basic ' +
          new Buffer(keys.client_id + ':' + keys.client_secret).toString(
            'base64'
          ),
      },
      json: true,
    }

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
          refresh_token = body.refresh_token

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: {
            Authorization: 'Bearer ' + access_token
          },
          json: true,
        }

        //Connect to API using token
        request.get(options, function (error, response, body) {
          console.log(body)
        })

        //Pass token to the browser to make requests
        res.redirect(
          '/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token,
          })
        )
      } else {
        res.redirect(
          '/#' +
          querystring.stringify({
            error: 'invalid_token',
          })
        )
      }
    })
  }
})

app.get('/refresh_token', function (req, res) {
  //Request access token using refresh token
  var refresh_token = req.query.refresh_token
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: 'Basic ' +
        new Buffer(keys.client_id + ':' + keys.client_secret).toString(
          'base64'
        ),
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    },
    json: true,
  }

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token
      res.send({
        access_token: access_token,
      })
    }
  })
})

console.log('Listening on 8080')
app.listen(8080)