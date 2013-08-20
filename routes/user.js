userDB = require('../db').userDB;
hash = require('../pass').hash;

// Authenticate using our plain-object database of doom!
function authenticate(email, pass, fn) {
  userDB.find({email:email}).toArray(function (err,users){
    if (err) {
      console.error('find user error', err);
      return fn(new Error('failed to found user'));
    }else{
		if (users.length == 0){
      if((email=='admin@email.com')&&(pass == 'admin'))
      {
        return fn(null,null);
      }else{
		   console.error('No user found', err);
       return fn(new Error('No user found'));
      }
		}else{
			console.log('found user:', users[0].name);
			hash(pass, users[0].createDate.toString(), function(err, hash){
			  if (err) return fn(err);
			  if (hash == users[0].pass){ 
			    return fn(null, users[0]);
			  }
			  fn(new Error('invalid password'));
			});
		}
	}
  });
};
function loginCheck(req, res){
  authenticate(req.body.email, req.body.password, function(err, user){
    if (err) {
    	req.session.user = {name:"",
                      email:"",
                      level: ""};
    	req.session.error = 'Authentication failed'
      console.error('Authentication failed', err);
      res.redirect('/');
    }
    else{
       // Regenerate session when signing in to prevent fixation 
       req.session.regenerate(function(){
        // Store the user's primary key 
        // in the session store to be retrieved,
        // or in this case the entire user object
       
		if(user ==null)
		  req.session.user = {_id:0,name: 'admin',email:'admin@email.com',level:'master',image: '/images/default1.jpg' };
		else
          req.session.user = {id:user._id.toHexString(),name:user.name,email:user.email,level:user.level,image:user.image};
		console.log(req.session.user.name +"["+req.session.user.level+"] login");
        res.redirect('/');
       });
    }
  })
};

exports.loginCheck = loginCheck;

exports.signup = function(req, res){
  userDB.find({name:req.body.email}).toArray(function (err,usrs){
     if(usrs.length==0)
     {
         regDate = new Date();
     	 hash(req.body.password, regDate.toString() , function(err, hash){
			   if (err){ 
			  	 console.error("Failed encrypto",err);
			  	 res.render('signup',{title: 'Sorry,the server is busy now,please try again.'});
			   }
			   else{ 
			     userDB.insert(
			       { name: req.body.username,
                     pass: hash,
                     email: req.body.email,
                     createDate: regDate,
                     level: "user", 
                     image: "/images/default1.jpg",
                     profile: "",
                     followers: [],
                     followings: [],
                     groups: [[]],
                     subscribes: [],
                     posts: [],
                     comments: [],
                     prizes:[]},
                   function(error,user){
                      //req.session.user = {id:user._id,name:user.name,email:user.email,level:user.level,image:user.image};
					  
					  if(error){
					    console.error('insert failed', error);
                        res.redirect('/');
					  }
					  else{ 
					    console.log(user.name +"["+user.level+"] insert");
						loginCheck(req,res);
					  }					    
                    }
               );}
         });
	 }else{
       res.render('signup',{title: 'Sorry,the username has been registered, please change a name.'});
     }   
  })
};

exports.logout = function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/');
  });
};
exports.userAdmin = function(req, res){
  if(req.session.user.level=="master"){
	userDB.find().toArray(function (err, usrs){
		res.render('users/userAdmin',
        {title: '用户管理',
        users: usrs,
        locations: [{name:'主页',address:'/',state:''},{name:'用户管理',address: '/userAdmin',state:'active'}],
        user: req.session.user});
    });
  }
};
exports.userSettings = function(req, res){
  if(req.session.user.level!=""){
    userDB.findById(req.session.user.id,function(error,user){
	   if(user==undefined)
	     user = req.session.user;
	   res.render('users/userSettings',{title: '用户设置',
	        locations: [{name:'主页',address:'/',state:''},{name:'用户设置',address: '/userSettings',state:'active'}],
			user: user
	   });
	})
  }
};

exports.updateUser = function(req,res){
  console.log("request info: " + req.body.updateName+" "+req.body.updateImage+" of "+req.session.user.id);
  if(req.session.user.level == "user"){
        userDB.update({_id:userDB.id(req.session.user.id)}, 
          {"$set":{name:req.body.updateName,
                 image:req.body.updateImage,
				 profile:req.body.profile}},
          function(err, result){
			if(err) console.error("update failed",err);		
			req.session.user.name = req.body.updateName;
			req.session.user.image = req.body.updateImage;
			req.session.user.profile = req.body.profile;
			console.log(req.session.user.name +" updated");
			res.redirect('back');
		  }
		)
	}
}
exports.updateUserPass = function(req,res){
  if((req.session.user.level == "master")||(req.session.user.id==req.body.uid)){
       userDB.update({_id:userDB.id(req.session.user.id)}, 
          {"$set":{pass:req.body.newPass}},
                {safe: true},
                function(err, result){
                  res.redirect('back')});
  }
}
exports.updateUserLevel = function(req,res){
  if(req.session.user.level == "master"){
    console.log("request info" + req.body.id);
    userDB.updateById(userDB.id(req.body.id), 
      {"$set":{level:req.body.level}},
      function(err, result){
        if(err) console.error("update error",err);
        res.redirect('back')
      }
    );
  }
}
exports.deleteUser = function(req,res){
  if(req.session.user.level == "master"){
    console.log("request info" + req.body.id);
    userDB.removeById(userDB.id(req.body.id), 
                function(err, result){
                  res.redirect('/userAdmin')});  
  }
}

exports.followUser = function(req, res) {
  if(req.session.user.level != "")
  {
    console.log("I am "+req.session.user.name+" following "+req.param('follow_id'));
    userDB.findAndModify({_id:userDB.id(req.param('follow_id'))}, 
        {"$push": {followers: {id: userDB.id(req.session.user.id), name: req.session.user.name,image:req.session.user.image}}},
       function(error, user) {
          if(error) console.error("add following failed",error);
          else{
            userDB.updateById(userDB.id(req.session.user.id), 
              {"$push": {followings: {id: user.id, name: user.name,image:user.image}}},
               function(error, counts) {
               if(error) console.error("add following failed",error);
              }
            )}
        })
   }
   res.redirect('back');
}

exports.unfollowUser = function(req, res) {
  if(req.session.user.level != "")
  {
    console.log("I am "+req.session.user.name+" unfollowing "+req.param('follow_id'));
    userDB.updateById(userDB.id(req.param('follow_id')), 
        {"$pull": {followers: {id: userDB.id(req.session.user.id)}}},
       function(error, counts) {
          if(error) console.error("unfollowing failed",error);
        }
    );
    userDB.updateById(userDB.id(req.session.user.id), 
        {"$pull": {followings: {id: req.param('follow_id')}}},
       function(error, counts) {
          if(error) console.error("unfollowing failed",error);
        }
    );
  }
   res.redirect('back');
}

exports.deleteFollowser = function(req, res) {
  if(req.session.user.level != "")
  {
    console.log("I am "+req.session.user.name+" delete follower "+req.param('follow_id'));

       userDB.updateById(userDB.id(req.param('follow_id')), 
        {"$pull": {followings: {id: userDB.id(req.session.user.id)}}},
       function(error, counts) {
          if(error) console.error("delete other following failed",error);
        }
    );
	userDB.updateById(req.session.user._id, 
        {"$pull": {followers: {id: req.param('follow_id')}}},
       function(error, counts) {
          if(error) console.error("delete follower failed",error);
        }
    );
  }
   res.redirect('back');
}

/*
 * GET users listing.
 */
exports.list = function(req,res){
  userDB.find().toArray(function (err, results){
    var relations = [];
    for( var i =0;i< results.length;i++ ){
  	  if(req.session.user.followings){
    		for( var j =0;j< req.session.user.followings.length;j++ ){
    		  if(req.session.user.followings[j].id == results[i]._id) relations[i] = {isFollowed:1,isFollower:0};
    		  else relations[i] = {isFollowed:1,isFollower:0};
    		}
	    }
  	  if(req.session.user.followers){
  	    for( var j =0;j< req.session.user.followers.length;j++){
    		  if(req.session.user.followers[i].id == results[i]._id) relations[i].isFollower = 1;
    		  else relations[i].isFollower = 0;
    		}
  	  }
  	}
    res.render('users/users', { title: 'title', users: results,relations:relations,
        locations: [{name:'主页',address:'/',state:''},{name:'用户管理',address: '/userAdmin',state:'active'}],
		user: req.session.user});
  })  
};

