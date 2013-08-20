/*
 * db connections
*/
topicDB = require('../db').topicDB;
columnDB = require('../db').columnDB;
userDB = require('../db').userDB;

function userCheck(req,res,fn){
    if (req.session.user == undefined) {
    	req.session.user = {name:"",
                      email:"",
                      level:'unregistered',
                      id: -1};
    }
    fn(req,res);
};
/* public methods */

/*
 * GET home page.
 */
exports.index = function(req,res){
	userCheck(req,res,function(req,res){
    console.log(req.session.user.name+"["+ req.session.user.id+"] logged in. level:"+req.session.user.level);
    columnDB.find().toArray(function(error,docs){
  	  if(error) console.error("failed get column",error);
  	  else{
	      res.render('index',{
			    title: 'title',
			    locations: [{name:'主页',address:'/',state:'active'}],
			    articles: docs,
          user: req.session.user
		    });
	    }
    })
  })
}

/*
 * GET Column page.
 */
exports.column = function(req,res){
	userCheck(req,res,function(req,res){
    columnDB.find().toArray(function(error,docs){
    	if(error) console.error("failed get column",error);
    	else{
  	     res.render('index', {
  			  title: 'title',
  			  locations: [{name:'主页',address:'/',state:''},{name:'专栏',address: '/column/',state:'active'}],
  			  articles: docs,
          user: req.session.user
  		  });
  	  }
    })
  })
}

/*
 * GET Topics page.
 */
exports.topics = function(req,res){
	userCheck(req,res,function(req,res){
    topicDB.find().toArray(function(error,docs){
    	if(error) console.error("failed get topic",error);
    	else{
    	  res.render('index', {
  			  title: 'title',
  			  locations: [{name:'主页',address:'/',state:''},{name:'话题',address: '/topics/',state:'active'}],
  			  articles: docs,
          user: req.session.user
  	    });
  	  }
  	})
  })
}

/*
 * GET Article of Column by _ID page.
 */  
exports.getColumnById =  function(req, res){
  console.log("getting article["+req.param('id')+"] in column");
  columnDB.findById(req.param('id'), function( error, docs) {
  	if(error) console.log("failed get article["+req.param('_id')+"] in column");
    else res.render('articleModal', {article: docs});
  });
}

/*
 * GET Article of Topic by _ID page.
 */  
exports.getTopicById =  function(req, res){
  topicDB.findById(req.param('_id'), function( error, docs) {
  	if(error) console.log("failed get article["+req.param('_id')+"] in column");
    else res.render('articleModal', {article: docs});
  });
}
/*
 * Post new Article of Column page.
 */  
exports.addColumn = function(req, res) {
	if(req.session.user._id)
	{
    columnDB.insert(
      {
        title: req.param('title'),
        body: req.param('body'),
        author: req.session.user,
        subscribers: [req.session.user],
        comments: []
      },
      function( error, docs) {res.redirect('/column')});
  }
}
/*
 * Post new Article of Topics page.
 */  
exports.addTopic = function(req, res) {
	if(req.session.user._id)
	{
    topicDB.insert(
      {
        title: req.param('title'),
        body: req.param('body'),
        author: req.session.user,
        subscribers: [req.session.user],
        comments: []
      },
      function( error, docs) {res.redirect('/topics')});
  }
}

/*
 * Post delete Article of Column page.
 */ 
exports.deleteColumnById = function(req, res) {
  console.log(req.session.user.name+" want to delelte:"+req.param('_id'));
  if(req.session.user.level=='master')
  {
      console.log("delelte:"+req.param('_id'));
      columnDB.removeById(columnDB.id(req.param('_id')), 
      function(error,docs){res.redirect('/column')}
    );
  }
}

/*
 * Post delete Article of Topics page.
 */ 
exports.deleteTopicById = function(req, res) {
  console.log(req.session.user.name+" want to delelte:"+req.param('_id'));
  if(req.session.user.level!='')
  {
    console.log("delelte:"+req.param('_id'));
    topicDB.removeById(topicDB.id(req.param('_id')), 
      function(error,docs){res.redirect('/topics')}
    );
  }
}

/*
 * Post add Comment to Article of Column page.
 */ 
exports.addColumnComment = function(req, res) {
	if(req.session.user._id)
  {
    console.error("Add comment ["+req.param('comment')+"] by "+req.session.user.name+" of article:"+req.param('_id'));
    columnDB.updateById(req.param('_id'), 
        {"$push": {comments: {
        person: req.session.user,
        comment: req.param('comment'),
        created_at: new Date()
       }}},
       function(error, counts) {
          if(error) console.error("add Comment failed",error);
          else{
              res.redirect('back');
          };
        }
    );
  }
}

/*
 * Post add Comment to Article of Topics page.
 */ 
exports.addTopicComment = function(req, res) {
	if(req.session.user._id)
  {
    topicDB.updateById(topicDB.id(req.param('_id')), 
        {"$push": {comments: {
        person: req.session.user,
        comment: req.param('comment'),
        created_at: new Date()
       }}},
       function( error, docs) {
           res.redirect('/topics')
       }
    );
  }
}