require('dotenv').config({path: '../.env'});
const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
const cors = require('cors');
const errorHandler = require('../handlers/error');
const authRoutes = require('../routes/auth');
const { loginRequired, ensureCorrectUser } = require('../middleware/auth');
const artistRoutes = require('../routes/artists');
const db = require('../models');

const client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
const redirect_uri = 'https://auth-server-bh.herokuapp.com/callback'; // Your redirect uri
const clientUrl = 'https://concert-lookup-bh.herokuapp.com';
//For Development Purposes
// const clientUrl = 'http://localhost:3000';
// const redirect_uri = 'http://localhost:8888/callback';

const PORT = process.env.PORT || 8888;

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
let generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = 'spotify_auth_state';

let app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Setting authorization routes
app.use('/api/auth', authRoutes);

//Creates an artist for a user
app.use(
     '/api/users/:id/artists',
     loginRequired,
     ensureCorrectUser,
     artistRoutes
   );

//Finds the list of artists for a particular user
app.get('/api/artists/:id',loginRequired, async function(req, res, next) {
  try {
    let foundUser = await db.User.findById(req.params.id);
    let artists = foundUser.artists.sort({createdAt: 'desc'});
    return res.status(200).json({
      artists,
      foundUser
    });
  } catch(err) {
      return next(err);
  }
});


//Creates and sends verification token through SMS for two-factor authentication
app.post('/createcode', function(req, res) {
  let number = req.body.number;
  messagebird.verify.create(number, {
      originator : 'Code',
      template : 'Your verification code is %token.'
  }, function (err, response) {
      if (err) {
          console.log(err);
      } else {
          res.status(200).json(response);
      }
  })
});


//Verifies SMS token for two-factor authentication
app.post('/verify', function(req, res) {
  let id = req.body.id;
  let token = req.body.token;
  messagebird.verify.verify(id, token, function(err, response) {
      if (err) {
          console.log(err);
      } else {
          res.status(200).json(response);
      }
  })
});

app.use(errorHandler);

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

            access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect(`${clientUrl}/#` +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

console.log('Listening on ', PORT);
app.listen(PORT);
