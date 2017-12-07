const md5 = require('md5')
const main = require('./db.js')
mc = main.mc
const ObjectId = require('mongodb').ObjectID;

const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session')

// const reroute = (endpoint) => `http://localhost:4200${endpoint}`
const reroute = (endpoint) => `https://lookbook.surge.sh${endpoint}`
const cookieKey = 'sid'
const mySecretMessage = 'This is a secret message.'
const default_picture = "https://openclipart.org/image/2400px/svg_to_png/235001/Birds-Silhouettes-Owl.png"

passport.serializeUser(function(user, done) {
	done(null, user._id)
})

passport.deserializeUser(function(id, done) {
	mc(function(db) {
		db.collection('users').findOne({_id: new ObjectId(id)}, function(err, user) {
			if (err) throw err;
			done(null, user)
		})
	})

})

const isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated())
		return next();
	res.redirect(reroute('/'));
}

// LOCAL
passport.use(new LocalStrategy({
	passReqToCallback:true
	},
	function(req, username, password, done) {
		if (!username || !password) {
			return done(null, false)
		}
		mc(function(db) {
			if (!req.user) {
				db.collection('users').findOne({username:username}, function(err, user) {
					if (err) {
						return done(err)
					};
					if (!user || md5(password + user.salt) != user.hash) {
						db.close()
						return done(null, false)
					}
					return done(null, user)
					db.close()
				})
			}
			else {
				// Merge follower lists
				let oauthuser = req.user
				db.collection('users').findOne({username:username}, function(err, user) {
					if (!user || md5(password + user.salt) != user.hash) {
						db.close()
						return done(null, false)
					}
				})
				db.collection('profiles').findOne({username:username}, function(err, luser) {
					if (!luser) {
						return done(null, false)
					}
					let l_arr = luser.following
					db.collection('profiles').update({username:oauthuser.username},
						{"$addToSet": {following: {"$each" : l_arr}}})
					// Remove OAuth profiles
					db.collection('users').deleteOne({username:oauthuser.username, auth:{'facebook':oauthuser.username}})
					db.collection('profiles').deleteOne({username:oauthuser.username})
					// Add OAuth login to local user document
					db.collection('users').update({username:username, auth:{'local':username}},
						{$push:{auth:{'facebook':oauthuser.username}}})
					return done(null, oauthuser)
				})
			}
		})
	}
));

const local_login = (req, res, next) => {
	passport.authenticate('local')(req, res, next)
}

//Action on success
const local_success = (req, res, next) => {
	res.send({result:"success"})
}

// FACEBOOK
passport.use(new FacebookStrategy({
	clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    //callbackURL: 'http://localhost:3000/callback/facebook',
    callbackURL: 'https://spooky-corpse-96953.herokuapp.com/callback/facebook',
    passReqToCallback:true,
    profileFields: ['emails']
	},
	function(req, token, refreshToken, user, done) {
		//register user in system
		const email = user.emails[0].value
		// SIMPLIFY/COLLAPSE LOGIC AFTER IMPLEMENTATION
		mc(function(db) {
			if (!req.user) {
				db.collection('users').findOne({auth:{'facebook':email}}, function(err, linkuser) {
					if (err) {
						return done(err)
					}
					// Check for an account that could already be linked with this FB account
					if (!linkuser) {
						db.collection('users').findOne({username:email, auth:{'facebook':email}}, function(err, dbuser) {
							if (err) {
								return done(err)
							}
							if (!dbuser) {
								const oauth_user = {username:email,salt:null,hash:null, auth:[{'facebook':email}]}
								db.collection('users').insertOne(oauth_user, function(err, res) {
									if (err) {
										return done(null, false)
									};
									db.close()
								})
								const oauth_profile = {username:email,status:"I'm new!",following:[],email:'',phone:'',dob:new Date(),zipcode:'',picture:default_picture}
								db.collection('profiles').insertOne(oauth_profile, function(err, res) {
									if (err) {
										return done(null, false)
									};
									db.close()
								})
								db.collection('users').findOne({username:email, auth:{'facebook':email}}, function(err, newuser) {
									if (err) {
										return done(null, false)
									};
									return done(null, newuser)
									db.close()
								})
							}
							else {
								return done(null, dbuser)
								db.close()
							}
						})
					}
					else {
						// Login with linked user
						return done(null, linkuser)
					}
				})
			}
			else {
				// Merge follower lists
				let localuser = req.user
				db.collection('profiles').findOne({username:email}, function(err, fbuser) {
					let fb_arr = fbuser.following
					db.collection('profiles').update({username:localuser.username},
						{"$addToSet": {following: {"$each" : fb_arr}}})
					// Remove OAuth profiles
					db.collection('users').deleteOne({username:email, auth:[{'facebook':email}]})
					db.collection('profiles').deleteOne({username:email})
				})
				// Add OAuth login to local user document
				db.collection('users').update({username:localuser.username, auth:{'local':localuser.username}},
					{$push:{auth:{'facebook':email}}})
				return done(null, localuser)
			}
		})
	}
))

const facebook_login = (req, res, next) => {
	passport.authenticate('facebook',{successRedirect:reroute('/#/main'), failureRedirect:reroute('/#')})(req,res,next)
}

const register = (req,res) => {
	var username = req.body.username
	var password = req.body.password
	var email = req.body.email
	var phone = req.body.phone
	var dob = req.body.dob
	var zipcode = req.body.zipcode

	var salt = Math.random().toString(36).substring(2)
	var hash = md5(password + salt)
	mc(function(db) {
		// Auth for local users has objects in a list for linking accounts. When linking OAuth account to local account,
		// always delete the OAuth one and add it to the local. 
		let userinfo = {username: username, salt:salt, hash:hash, auth:[{'local':username}]}
		db.collection("users").insertOne(userinfo, function(err, res) {
			if (err) throw err;
			db.close()
		})
		let profileinfo = {username: username,
							status: "I'm new!",
							following: [],
							email: email,
							phone: phone,
							dob: new Date(dob).getTime(),
							zipcode: zipcode,
							picture: default_picture}
		console.log("PROFILE", profileinfo)
		db.collection("profiles").insertOne(profileinfo, function(err, res) {
			console.log("INSERTED")
			if (err) throw err;
			db.close()
		})
	})
	res.send({result:"success", username: username})
}

const unlink = (req, res, next) => {
	const site = req.params.site
	mc(function(db) {
		let query = {username:req.user.username}
		query[`auth.${site}`] = {'$exists':true}
		let pullquery = {'$pull':{'auth':{}}}
		pullquery['$pull']['auth'][site] = {'$exists':true}
		db.collection('users').update(query, pullquery)
		res.redirect(reroute('/#/profile'))
		db.close()
	})
}

const logout = (req, res) => {
	req.logout()
	req.user = null
	req.session.destroy()
}

module.exports = (app) => {
	app.use(session({name: cookieKey, secret: mySecretMessage, resave:true, saveUninitialized:true}))
	app.use(passport.initialize());
	app.use(passport.session());

	app.post('/login', local_login, local_success)
	app.post('/register', register)
	app.get('/login/facebook', passport.authenticate('facebook', {scope:'email'}))
	app.get('/callback/facebook', facebook_login)
	app.get('/unlink/:site', unlink)
	app.put('/logout', logout)
	app.use(isLoggedIn)
}