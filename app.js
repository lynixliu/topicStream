
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/addArticle', routes.addTopic);
app.post('/deleteArticle', routes.deleteTopicById);
app.post('/addComment', routes.addTopicComment);
app.post('/deleteComment', routes.deleteTopicCommentById);

app.get('/column', routes.column);
app.get('/column/:id', routes.getColumnById);
app.post('/column/addArticle', routes.addColumn);
app.post('/column/deleteArticle', routes.deleteColumnById);
app.post('/column/addComment', routes.addColumnComment);
app.post('/column/deleteComment', routes.deleteColumnCommentById);

app.get('/topics', routes.topics);
app.get('/topics/:id', routes.getTopicById);
app.post('/topics/addArticle', routes.addTopic);
app.post('/topics/deleteArticle', routes.deleteTopicById);
app.post('/topics/addComment', routes.addTopicComment);
app.post('/topics/deleteComment', routes.deleteTopicCommentById);

app.post('/signup', user.signup);
app.post('/login', user.loginCheck);
app.get('/logout', user.logout);
app.get('/users', user.list);
app.get('/userAdmin', user.userAdmin);
app.get('/userSettings', user.userSettings);
app.post('/userUpdateLevel', user.updateUserLevel);
app.post('/userDelete',user.deleteUser);
app.post('/userUpdate', user.updateUser);
app.post('/passwordReset', user.updateUserPass);
app.post('/userFollowing', user.followUser);
app.post('/userunFollowing', user.unfollowUser);
app.post('/cancelFollowing', user.deleteFollower);
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});