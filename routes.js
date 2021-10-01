const passport = require('passport');
const bcrypt = require('bcrypt');

function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

module.exports = function (app, myDataBase) {
  app.route('/').get( (req, res) => {
    const objForm = {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    };
    res.render( process.cwd() + '/views/pug/index', objForm );
  });

  app.get('/chat', ensureAuthenticated, (req, res) => {
    objUser = {
      user: req.user
    };
    res.render(  process.cwd() + '/views/pug/chat', objUser );
  });

  app.post('/login', passport.authenticate('local', { successRedirect: '/profile',
                                                      failureRedirect: '/' }));
  
  app.route('/profile').get( ensureAuthenticated, (req, res) => {
    //console.dir( req );
    const objForm = {
      username: req.user.username || req.user.name
    };
    res.render( process.cwd() + '/views/pug/profile' , objForm );
  });

  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.route('/auth/github/callback')
     .get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
       req.session.user_id = req.user.id;
       res.redirect('/chat');
     });

  app.route('/auth/github').get( passport.authenticate('github') );

  app.route('/register').post( (req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, ( err, user ) => {
      if ( err ) {
        console.log('err on findone');
        next( err );        
      } 
      else if( user ) res.redirect( '/' );
      else {
        const hash = bcrypt.hashSync(req.body.password, 12);
        const objUserInfo = {
          username: req.body.username,
          password: hash
        };
        myDataBase.insertOne( objUserInfo, (err, doc) => {
          if( err ) {
            console.log('err on insertone');
            res.redirect( '/' );
          } 
          else next( null, doc.ops[0] );
        });
      }
    });
  }, passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/' }));

  app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
  });

}