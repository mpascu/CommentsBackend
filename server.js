var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var auth = require("./simpleAuth");
var app = express();
//app.use(createSession);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
function logger(req,res,next){
    console.log("* %s: %s %s ",
        req.connection.remoteAddress,
        req.method,
        req.url
    );
    next();
}
app.use(logger);

var posts = [
    {id:0, alertId:"Comentari 1", comment: "aaaaaa"},
    {id:1, alertId:"Comentari dos", comment: "Aixo es la descripció del segon post d'aquest blog cutre"},
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
/*
app.post("/login",createSession({
    redirect: "/secret"
}));
app.get("/secret",requiresSession,function(req,res){
    res.end("Hola,"+ req.user.email);
});
app.get("/logout",destroySession,function(req,res){
    res.end("T'has desloguejat");
});*/

/////////////////////////////////
////POSTS ///////////////////////
/////////////////////////////////
app.get("/comentaris", function(req, res) {
    res.render("comentaris",{comments:posts});
});

app.get("/comentaris/new", function(req, res) {
    res.render("comentForm");
});

app.post("/comentaris", function(req, res, next) {
    posts[posts.length]={id:posts.length, alertId:req.body.alertId, comment: req.body.comment};
    next("/comentaris");
});

app.param("comentid", function(req, res, next, postId) {
    req.post = posts[postId];
    if (!req.post) {
        next( new Error("Comentari no trobat("+postId+")"));
    } else{
        next();
    }
});

app.get("/comentaris/:comentid/edit", function(req, res) {
    res.render("comentEdit",{post:posts[req.post.id]});
});

app.get("/comentaris/:comentid", function(req, res) {
    res.render("comentari",{title:posts[req.post.id]});
});

app.post("/comentaris/:comentid", function(req, res, next) {
    posts[req.post.id]={id:req.post.id, alertId:req.body.alertId, comment: req.body.comment};
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
