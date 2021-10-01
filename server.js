'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const pug = require('pug');
const passport = require('passport');
const session = require('express-session');
//const bodyParser = require('body-parser');
const routes = require('./routes.js'); 
const auth = require('./auth.js');


const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore =require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

app.set('view engine', 'pug');

app.use( (req, res, next) => {
  console.log(`[LOGGER] ${req.method}: ${req.path} - ${req.ip}` );
  next();
});

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));
app.use(passport.initialize());
app.use(passport.session());

io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: 'express.sid',
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail
    })
  );


myDB( async client => {
  const myDataBase = await client.db('database').collection('users');  

  
  let currentUsers = 0;
  io.on('connection', socket => {
    io.emit( 'user', {
      name: socket.request.user.name || socket.request.user.username,
      currentUsers,
      connected: true
    });

    console.log('user ' + socket.request.user.name + ' connected');
    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      io.emit( 'user', {
        name: socket.request.user.name || socket.request.user.username,
        currentUsers,
        connected: false
      });
    });

    socket.on('chat message', message => {
      io.emit( 'chat message', {
        name: socket.request.user.name || socket.request.user.username,
        message
      });
    });
    
    console.log('A user has connected');
  });

  routes( app, myDataBase );
  auth( app, myDataBase );

}).catch( e => {

  app.route('/').get( (req, res) => {
    console.log('failed');
    const objErrmsg = { 
      title: e,
      message: 'Unable to Login : DB error'
    };
    res.render( process.cwd() + '/views/pug/index', objErrmsg );
  });
  
});

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
