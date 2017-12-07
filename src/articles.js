var main = require('./db.js')
mc = main.mc
const uploadImage = require('../uploadCloudinary').uploadImage

const getArticles = (req, res) => {
	const id = req.params.id
	const limit = parseInt(req.params.lim)
	const followers = 
	mc(function(db) {
		db.collection('profiles').findOne({username:req.user.username}, function(err, user) {
			let query = {author:{$in:{}}}
			let queryusers = user.following
			queryusers.push(req.user.username)
			query['author']['$in'] = queryusers
			if (id) {
				if (parseInt(id)) {
					query['id'] = id
				}
				else {
					query['$or'] = [{author: id},{body:new RegExp(id)}]
				}
			}
			db.collection('posts').find(query).sort({ date: -1 }).limit(limit).toArray(function(err, posts) {
				res.send({articles:posts})
			})
		})
	})
}

const addArticle = (req, res) => {
	const text = req.body.text
	const user = req.user.username
	const img = req.fileurl
    mc(function(db) {
    	db.collection('posts').count({}, function(error, count){
	        if(error) return callback(err);
	        var nid = count + 1
	        let article = {id: nid, author: user, body: text, date: Date.now(), img:img, comments:[]}
	        db.collection("posts").insertOne(article, function(err, res) {
				if (err) throw err;
				db.close()
			})
			db.collection("posts").findOne({id:nid}, function(err, user) {
				if (err) throw err;
				res.send(user)
				db.close()
			})
	    })
	})
}

const edit = (req, res) => {
	const a_id = parseInt(req.params.id)
	const newtext = req.body.text
	const c_id = req.body.commentId
	mc(function(db) {
		// Edit/add comment
		if (c_id) {
			db.collection('posts').findOne({id:a_id}, function(err, post) {
				if (err) throw err;
				
				//Edit existing comment
				if (c_id > -1) {
					db.collection('posts').update({"id":a_id, "comments.commentId":c_id}, 
						{$set: {"comments.$.body":newtext}})
					.then(
						db.collection("posts").findOne({id:a_id}, function(err, post) {
							if (err) throw err;
							res.send(post)
							db.close()
						}))
				}
				//Add a new comment
				else {
					db.collection('posts').findOne({"id":a_id}, function(err, post) {
						let nid = post.comments.length + 1
						db.collection('posts').update({"id":a_id},
							{$push: {"comments":{
								commentId: nid,
								author: req.user.username,
								body: newtext,
								date: Date.now()
							}}}
						)
						.then(
							db.collection("posts").findOne({id:a_id}, function(err, post) {
								if (err) throw err;
								res.send(post)
								db.close()
						}))
					})
				}
			})
		}
		// No c_id was supplied, so edit article
		else {
			db.collection('posts').findOne({id:a_id}, function(err, post) {
				db.collection('posts').update({id:a_id},
					{$set: {body: newtext}})
				db.collection("posts").findOne({id:a_id}, function(err, post) {
					if (err) throw err;
					res.send(post)
					db.close()
				})
			})
		}
		
	})
}

module.exports = (app) => {
	app.get('/articles/:id*?/:lim', getArticles)
	app.post('/article', uploadImage('avatar'), addArticle)
	app.put('/articles/:id', edit)
}