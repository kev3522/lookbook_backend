// this is profile.js which contains all user profile 
// information except passwords which is in auth.js
var main = require('./db.js')
mc = main.mc
const uploadImage = require('../uploadCloudinary').uploadImage

const getHeadlines = (req, res) => {
    const users = req.params.users ? req.params.users.split(',') : ""
    mc(function(db) {
        let query = users ? {username : {$in : users}} : {}
        db.collection('profiles').find(query).toArray(function(err, users) {
            headlines = users.map(function(profile) {
                return {username:profile.username, headline:profile.status}
            })
            res.send({headlines:headlines})
        })
    })
}

const putHeadline = (req, res) => {
    const user = req.user.username ? req.user.username : 'testuser'
    const newheadline = req.body.headline
    mc(function(db) {
        db.collection('profiles').update({username:user}, 
            {$set: {status: newheadline}})
        db.collection('profiles').find({username:user}).toArray(function(err, users) {
            res.send({username:users[0].username, headline:users[0].status})
        })
        db.close()
    })
}

const getEmail = (req, res) => {
    const user = req.params.user
    mc(function(db) {
        let query = user ? {username: user} : {username: req.user.username}
        db.collection('profiles').find(query).toArray(function(err, user) {
            res.send({username:user[0].username, email:user[0].email})
        })
    })
}

const putEmail = (req, res) => {
    const user = req.user.username
    const newemail = req.body.email
    mc(function(db) {
        db.collection('profiles').update({username:user},
            {$set: {email: newemail}})
        db.collection('profiles').find({username:user}).toArray(function(err, users) {
            res.send({username:users[0].username, email:users[0].email})
        })
        db.close()
    })
}

const getZipcode = (req, res) => {
    const user = req.params.user
    mc(function(db) {
        let query = user ? {username: user} : {username: req.user.username}
        db.collection('profiles').find(query).toArray(function(err, user) {
            res.send({username:user[0].username, zipcode:user[0].zipcode})
        })
    })
}

const putZipcode = (req, res) => {
    const user = req.user.username
    const newzipcode = req.body.zipcode
    mc(function(db) {
        db.collection('profiles').update({username:user},
            {$set: {zipcode: newzipcode}})
        db.collection('profiles').find({username:user}).toArray(function(err, users) {
            res.send({username:users[0].username, zipcode:users[0].zipcode})
        })
        db.close()
    })
}

const getAvatars = (req, res) => {
    const users = req.params.users ? req.params.users.split(',') : ""
    mc(function(db) {
        let query = users ? {username : {$in : users}} : {}
        db.collection('profiles').find(query).toArray(function(err, users) {
            avatars = users.map(function(profile) {
                return {username:profile.username, avatar:profile.picture}
            })
            res.send({avatars:avatars})
        })
    })
}

const uploadAvatar = (req, res) => {
    const user = req.user.username
    const newavatar = req.fileurl
    mc(function(db) {
        db.collection('profiles').update({username:user},
            {$set: {picture: newavatar}})
        db.collection('profiles').find({username:user}).toArray(function(err, users) {
            res.send({username:users[0].username, avatar:users[0].picture})
        })
        db.close()
    })
}

const getDOB = (req, res) => {
    const user = req.user.username
    mc(function(db) {
        db.collection('profiles').findOne({username:user}, function(err, profile) {
            res.send({username:user, dob: profile.dob})
        })
    })
}

module.exports = (app) => {
    app.get('/headlines/:users*?', getHeadlines)
    app.put('/headline', putHeadline)
    app.get('/email/:user?', getEmail)
    app.put('/email', putEmail)
    app.get('/zipcode/:user?', getZipcode)
    app.put('/zipcode', putZipcode)
    app.get('/avatars/:users*?', getAvatars)
    app.put('/avatar', uploadImage('avatar'), uploadAvatar)
    app.get('/dob', getDOB)
}