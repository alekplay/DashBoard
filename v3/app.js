var express = require('express');
var passport = require('passport');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var passportlocal = require('passport-local');
var  mongoose = require('mongoose')
var app = express();
var schema = mongoose.Schema;


app.use(express.static('views'));


var UserSchema =  new schema({
	firstName: {type:String, required: true},
	lastName: {type: String, required: true},
	password: {type: String, required: true},
	email: {type:String, required: true, unique: true}
})

var User = mongoose.model('User',UserSchema)

var dbURI = "mongodb://localhost:27017/user"
mongoose.connect(dbURI)
mongoose.connection.on('connected', function(){
	console.log("Mongoose default connection open to:" + dbURI);
})
//If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log('Mongoose default connection error: ' + err);
}); 
// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose default connection disconnected'); 
});
// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Mongoose default connection disconnected through app termination'); 
    process.exit(0); 
  }); 
}); 

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressSession({
	secret: process.env.SESSION_SECRET || 'secret',
	resave: false,
	saveUnitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportlocal.Strategy(function(email,password,done){
	if (email == 'admin' && password == 'password'){
		done(null,{id: email, password: password});
	} else {
		done(null,null);
	}
}));

passport.serializeUser(function(user,done) {
	done(null,user.id);
});

passport.deserializeUser(function(id, done){
	//query against database 
	done(null,{ id: id, name: id});
})




app.get('/',function(req,res){
	res.render('index',{
		isAuthenticated: req.isAuthenticated(),
		user: req.user
	});
});

app.post('/',function(req,res){
	console.log(req.body);
	if(req.body.submit == 'Log In'){
		var data = {"email":req.body.email,"password":req.body.password};
		User.count(data,function(err,count){
			if(count>0){
				res.redirect('home')
			}else{
				res.redirect('/')
			}
		});
	}else{
		if(req.body.password != req.body.passwordVerify){
			res.redirect('invalidPassword')	
		}else{
			var newUser = User({
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				password: req.body.password,
				email: req.body.email
				});

			newUser.save(function(err){
			if(err){ 
				console.log(err);
				res.redirect('/emailUsed')
			}else{
				res.redirect('/');
			}
			});
		}
	};
})

app.get('/invalidPassword', function(req,res){
	res.render('invalidPassword');
})

app.get('/emailUsed', function(req,res){
	res.render('emailUsed')
})


app.get('/home',function(req,res){
	 var stockURL = "http://finance.yahoo.com/webservice/v1/symbols/aapl,goog,msft/quote?format=json";
	 
	res.render('home')
});


app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.listen(3000, function() {
	console.log("Listening on Port: 3000");
});