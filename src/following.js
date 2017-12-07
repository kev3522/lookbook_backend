var main = require('./db.js')
mc = main.mc

const getFollowing = (req, res) => {
	const user = req.params.user
    console.log(req.user)
    mc(function(db) {
        let query = user ? {username: user} : {username: req.user.username}
        console.log(query)
        db.collection('profiles').find(query).toArray(function(err, user) {
            res.send({username:req.user.username, following:user[0].following})
        })
        db.close()
    })
}

const putFollowing = (req, res) => {
    const user = req.user.username
    const newfollowing = req.params.user
    mc(function(db) {
        db.collection('profiles').update({username:user},
            // Replace hardcoded email with actual input
            {$push: {following: newfollowing}})
        db.collection('profiles').find({username:user}).toArray(function(err, users) {
        	res.send({username:users[0].username, following:users[0].following})
        })
        db.close()
    })
}

const deleteFollowing = (req, res) => {
    const user = req.user.username
    const toDelete = req.params.user
    mc(function(db) {
        db.collection('profiles').update({username:user},
            {$pull: {following: toDelete}})
            .then(
                db.collection('profiles').find({username:user}).toArray(function(err, users) {
                    res.send({username:users[0].username, following:users[0].following})
                })
            )
        db.close()
    })
}

module.exports = (app) => {
    app.get('/following/:user*?', getFollowing)
    app.put('/following/:user', putFollowing)
    app.delete('/following/:user', deleteFollowing)
}