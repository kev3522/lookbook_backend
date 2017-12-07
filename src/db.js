var MongoClient = require('mongodb').MongoClient
var url = "mongodb://heroku_9mq3l0rd:f5moaremgjoi7gesrm0ns6h4ck@ds245615.mlab.com:45615/heroku_9mq3l0rd"

function mc(execute) {
	var args = Array.prototype.slice.call(arguments, 1)
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.err('There was a problem', err)
		} else {
			args.unshift(db)
			execute.apply(null, args)
		}
	})
}
exports.mc = mc