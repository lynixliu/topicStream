var mongo = require('mongoskin');
var db = mongo.db('localhost:27017/node-mongo-blog?auto_reconnect');

exports.topicDB = db.bind('topics');
exports.columnDB = db.bind('columns');
exports.userDB = db.bind('users');
