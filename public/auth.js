//Spotify API authorization code flow
//Uses token with refresh token
(function () {
  function getHashParams() {
    var hashParams = {}
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1)
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2])
    }
    return hashParams
  }

  var userProfileSource = document.getElementById('user-profile-template')
    .innerHTML,
    userProfileTemplate = Handlebars.compile(userProfileSource),
    userProfilePlaceholder = document.getElementById('user-profile')

  var oauthSource = document.getElementById('oauth-template').innerHTML,
    oauthTemplate = Handlebars.compile(oauthSource),
    oauthPlaceholder = document.getElementById('oauth')

  var params = getHashParams()

  var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error

  if (error) {
    alert('Authentication Error')
  } else {
    if (access_token) {
      oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token,
      })

      $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + access_token,
        },
        success: function (response) {
          userProfilePlaceholder.innerHTML = userProfileTemplate(response)
          $('#login').hide()
          $('#loggedin').show()
          userid = response.id
          country = response.country
          token = access_token
          console.log(response)
        },
      })
    } else {
      $('#login').show()
      $('#loggedin').hide()
    }

    document.getElementById('obtain-new-token').addEventListener(
      'click',
      function () {
        $.ajax({
          url: '/refresh_token',
          data: {
            refresh_token: refresh_token,
          },
        }).done(function (data) {
          access_token = data.access_token
          oauthPlaceholder.innerHTML = oauthTemplate({
            access_token: access_token,
            refresh_token: refresh_token,
          })
        })
      },
      false
    )
  }
})()