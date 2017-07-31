var fs = require('fs');
var multer = require('multer');
var User       = require('../app/models/user');
var Chat       = require('../app/models/chat');
// var upload = multer({ dest: './uploads' });
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);        
  }
})

var upload = multer({ storage: storage })
// var upload = multer({ dest: 'uploads/' })

    // var app = require('express')();

var chat = Chat.chat;

module.exports = function(app, passport) {
    var http = require('http').Server(app);
    var io = require('socket.io')(http);

// normal routes ===============================================================

    // online last time
    app.all('*', function(req, res, next) {
        var user = req.user;

        if (req.session.visited && user) {
            user.local.online = req.session.visited;
            user.save(function(err) {
                // res.redirect('/me');
            });
        }
        req.session.visited = Date.now();
        next();
    });

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/test', function(req, res){
        res.render('test.ejs', {

        });
});

    // PROFILE SECTION =========================
    app.get('/me', isLoggedIn, function(req, res) {
        var user   = req.user;
        var visitors = new Array();
        var likers = new Array();

        User.find({ 'local.likes':  user.local.login }, function(err, likersArray) {
            if (err) return handleError(err);
            for (liker in likersArray) {
                // console.log("likes: " + likersArray[liker].local.login);
                likers.push(likersArray[liker].local.login);
            }

            User.find({ 'local.visits':  user.local.login }, function(err, visitorsArray) {
                if (err) return handleError(err);
                for (visitor in visitorsArray) {
                    // console.log("visits: " + visitorsArray[visitor].local.login);
                    visitors.push(visitorsArray[visitor].local.login);
                }

                res.render('profile.ejs', {
                    user     : user,
                    likers   : likers,
                    visitors : visitors
                });
            });

        });
    });

    // process the edit form
    app.post('/me', isLoggedIn, function(req, res) {
        var user = req.user;

        if (req.body.name !== "")
            user.local.name = req.body.name;
        if (req.body.gender)
           user.local.gender = req.body.gender;
        if (req.body.orient)
           user.local.orient = req.body.orient;
        if (req.body.age !== '-1')
            user.local.age = req.body.age;
        if (req.body.agegap !== '-1')
            user.local.agegap   = req.body.agegap;
        if (req.body.about !== "")
           user.local.about = req.body.about;
        user.save(function(err) {
            res.redirect('/me');
        });
    });


    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/me', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/me', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/me',
                failureRedirect : '/'
            }));

    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/me',
                failureRedirect : '/'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/me', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/me',
                failureRedirect : '/'
            }));

    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/me',
                failureRedirect : '/'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/me');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/me');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/me');
        });
    });

    // ADD TAG
    app.post('/add-tag', isLoggedIn, function(req, res) {
        var user = req.user;

        if (req.body.tag.trim() !== "")
            user.local.tags.addToSet(req.body.tag.trim());
        user.save(function(err) {
            res.redirect('/me');
        });
    });

    // IMAGE UPLOAD
    // app.post('/api/photo', upload.single('file'), isLoggedIn, function(req, res){
    var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 4 }])
    app.post('/api/photo', cpUpload, function (req, res, next) {
        var user = req.user;

        if (req.files['avatar'])
            user.local.avatar = req.files['avatar'][0].path;
        if (req.files['gallery']) {
            if (req.files['gallery'][0])
                user.local.img1 = req.files['gallery'][0].path;
            if (req.files['gallery'][1])
                user.local.img2 = req.files['gallery'][1].path;
            if (req.files['gallery'][2])
                user.local.img3 = req.files['gallery'][2].path;
            if (req.files['gallery'][3])
                user.local.img4 = req.files['gallery'][3].path;
        }
        user.save(function(err) {
            res.redirect('/me');
        });
    });

    // search/browsering
    app.get('/search', isLoggedIn, function(req, res) {
        var user   = req.user;
        var people = new Array();

        User.find({}, function (err, peopleArray) {
            if (err) return handleError(err);

            for (person in peopleArray) {
                people.push(peopleArray[person]);
            }
            if (people) {
                res.render('search.ejs', {
                    user   : user,
                    people : people
                });
            } else res.redirect('/me');
        });
    });

        // search/browsering
    app.get('/map', isLoggedIn, function(req, res) {
        var user   = req.user;
        var people = new Array();

        User.find({}, function (err, peopleArray) {
            if (err) return handleError(err);

            for (person in peopleArray) {
                people.push(peopleArray[person]);
            }
            if (people) {
                res.render('map.ejs', {
                    user   : user,
                    people : people
                });
            } else res.redirect('/me');
        });
    });
    
    // other user's (person's) profile page
    app.get('/:login', isLoggedIn, function(req, res) {
        var user   = req.user;
        var likes  = user.local.likes;
        var visits = user.local.visits;
        if (user.local.login === req.params.login) {
            res.redirect('/me'); // redirects you to your profile page
        }

        User.findOne({ 'local.login': req.params.login }, function (err, person) {
            if (err) return handleError(err);
            if (person) {
                visits.addToSet(req.params.login); // adds visit
                user.save(function(err) {
                    res.render('person.ejs', {
                        person   : person,  // profile you are watching now
                        user     : user, // logged in user
                        liked    : (likes.indexOf(person.local.login) > -1) ? "Unlike" : "Like",
                        likedYou : (person.local.likes.indexOf(user.local.login) > -1) ? "True" : "False"
                    });
                });
            }
            else {
                res.redirect('/');  // user not found
            }
        });
    });

    // LIKE/UNLIKE button
    app.post('/like', isLoggedIn, function(req, res) {
        var user   = req.user;
        var person = req.body.person;
        var likes  = user.local.likes;

        User.find({ 'local.login' : user.local.login, 'local.likes' : person }, function(err, found) {
            if (likes.indexOf(person) > -1) {
                User.update({ 'local.login' : user.local.login }, { $pull: { 'local.likes' : person } }, function(err) {
                    user.save(function(err) {
                        // console.log("user exists")
                        res.send({ liked: 'Like' })
                    });
                    io.on('connection', function(socket){
                        socket.on('like', function(who){
                            socket.emit('like', who);
                        });
                    });
                });
            } else {
                user.local.likes.addToSet(person);
                user.save(function(err) {
                    // console.log("user don't exist")
                    res.send({ 
                        liked: 'Unlike'
                    })
                });
            }
        });
    });

    // Chat
    app.get('/chat/:login', isLoggedIn, function(req, res) {
        var user   = req.user;
        var likes  = user.local.likes;
        var visits = user.local.visits;
        var messages = new Array();
        if (user.local.login === req.params.login) {
            res.redirect('/me'); // redirects you to your profile page
        }

        User.findOne({ 'local.login': req.params.login }, function (err, person) {
            if (err) return handleError(err);
            if (person) {
                Chat.find({ $or : [
                    { $and : [ { 'sender' : person.local.login }, { 'recipient' : user.local.login } ] },
                    { $and : [ { 'sender' : user.local.login }, { 'recipient' : person.local.login } ] }
                ]}, function (err, msgArray) {
                    if (err) return handleError(err);
                    for (message in msgArray) {
                        messages.push(msgArray[message]);
                    }
                    res.render('chat.ejs', {
                        person   : person,  // profile you are watching now
                        user     : user, // logged in user
                        liked    : (likes.indexOf(person.local.login) > -1) ? "Unlike" : "Like",
                        likedYou : (person.local.likes.indexOf(user.local.login) > -1) ? "True" : "False",
                        chats    : messages
                    });
                });
            }
            else {
                res.redirect('/me');  // user not found
            }
        });
    });

    app.post('/message', isLoggedIn, function(req, res) {
        var user   = req.user.local.login;
        var person = req.body.person;
        var msg    = req.body.msg;
        // add message to user's array
        // user.local.msgs.person.addToSet(req.body.msg);
        // user.local.msgs.person.message = req.body.msg;
        // console.log(user);
        // console.log(person);
        // console.log(msg);
        // create the Chat
        var newChat = new Chat();

        newChat.sender    = user;
        newChat.recipient = person;
        newChat.message   = msg;

        newChat.save(function(err) {
            if (err) return handleError(err);
        });
    });    

    // save user positioning
    app.post('/position', isLoggedIn, function(req, res) {
        var user   = req.user;
        var pos    = req.body.pos;

        console.log(pos);
        user.local.position = pos;
        user.save(function(err) {
            if (err) return handleError(err);
        });
    });  
};


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
