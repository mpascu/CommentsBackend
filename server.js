var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var auth = require("./simpleAuth");
var app = express();
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      autoIncrement = require('mongoose-auto-increment');
var jwt = require("jsonwebtoken");
//app.use(createSession);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
function logger(req,res,next){
    console.log("* %s: %s %s ",
        req.connection.remoteAddress,
        req.method,
        req.url
    );
    next();
}
app.use(cookieParser());
app.use(logger);
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

var connection = mongoose.connect('mongodb://edurenye.dyndns.org/DB');
autoIncrement.initialize(connection);
var commentsSchema = new Schema({
   id:      { type: Number },
   alertId: { type: String },
   comment: { type: String } 
    
});

commentsSchema.plugin(autoIncrement.plugin, 'Comments');
commentsSchema.plugin(autoIncrement.plugin, { model: 'Comments',field:'id'});

var Comments = connection.model('Comments',commentsSchema);
var UserSchema = new Schema({
    username: String,
    password: String,
    token: String
});
var Users = connection.model('Users',UserSchema);
var posts = [
    {id:0, alertId:"16", comment: "aaaaaa"},
    {id:1, alertId:"16", comment: "Aixo es la descripció del segon post d'aquest blog cutre"},
];
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(express.static(path.join(__dirname, 'public')));


///////////////////////////////
///LOGIN I USUARIS/////////////
///////////////////////////////
app.get("/login", function(req, res) {
    res.render("login");
});
app.get("/register", function(req, res) {
    res.render("register");
});
app.post('/authenticate', function(req, res) {
    Users.findOne({username: req.body.username, password: req.body.password}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
               res.json({
                    type: true,
                    data: user,
                    token: user.token
                });
            } else {
                res.json({
                    type: false,
                    data: "Incorrect email/password"
                });   
            }
        }
    });
});
app.post('/signin', function(req, res) {
    Users.findOne({username: req.body.username, password: req.body.password}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
                res.json({
                    type: false,
                    data: "User already exists!"
                });
            } else {
                var userModel = new Users();
                userModel.username = req.body.username;
                userModel.password = req.body.password;
                userModel.save(function(err, user) {
                    if(err) throw err;
                    user.token = jwt.sign(user, "passTOKENS");
                    user.save(function(err, user1) {
                        res.json({
                            type: true,
                            data: user1,
                            token: user1.token
                        });
                    });
                });
            }
        }
    });
});
/*
app.get("/secret",requiresSession,function(req,res){
    res.end("Hola,"+ req.user.email);
});
app.get("/logout",destroySession,function(req,res){
    res.end("T'has desloguejat");
});*/
app.get('/me', ensureAuthorized, function(req, res) {
    Users.findOne({token: req.token}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            res.json({
                type: true,
                data: user
            });
        }
    });
});
function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.send(403);
    }
}
/////////////////////////////////
/// COMENTARIS //////////////////
/////////////////////////////////
app.get("/comentaris", function(req, res) {
    Comments.find(function (err, commnts) {
        console.log(commnts);
        res.render("comentaris",{comments:commnts});
    });
    
});
app.get("/comentarisJSON", function(req, res) {
    Comments.find(function (err, commnts) {
        res.json(commnts);
    });    
});
app.get("/comentaris/new", function(req, res) {
    res.render("comentForm");
});

app.post("/comentaris", function(req, res, next) {
    Comments.create({alertId:req.body.alertId, comment: req.body.comment});
    //posts[posts.length]={id:posts.length, alertId:req.body.alertId, comment: req.body.comment};
    next("/comentaris");
});

app.param("comentid", function(req, res, next, postId) {
    Comments.findOne({ id: postId },function (err, commnts) {
        req.post = commnts;
        //console.log(postId+"aaaaaaaaaaaaaa"+req.post);
        if (!req.post) {
        next( new Error("Comentari no trobat("+postId+")"));
    } else{
        next();
    }
    });
    
});

app.get("/comentaris/:comentid/edit", function(req, res) {
    
    res.render("comentEdit",{post:req.post});
});

app.get("/comentaris/:comentid", function(req, res) {
    console.log(req.post);
    res.render("comentari",{title:req.post});                
});

app.post("/comentaris/:comentid", function(req, res, next) {
    Comments.findOneAndUpdate({id:req.body.id}, {comment: req.body.comment});
    
    posts[req.post.id]={id:req.post.id, alertId:req.body.alertId, comment: req.body.comment};
    next("/comentaris");
});
app.get("/deleteAll", function(req, res,next) {
    Comments.remove(function(err,numberAffected,raw){
        
    });
    next("/comentaris");
});
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
