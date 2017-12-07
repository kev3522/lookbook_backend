if (process.env.NODE_ENV !== "production") {
	require('dotenv').load()
}
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const app = express()
app.use(bodyParser.json())
app.use(cookieParser())

//We want to enable CORS so frontend and backend can communicate, req.headers.origin
const enableCors = (req, res, next) => {
	res.header("Access-Control-Allow-Origin", req.headers.origin);
	// res.header("Access-Control-Allow-Origin", 'https://lookbook.surge.sh')
	res.header("Access-Control-Allow-Credentials", true);
	res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
	res.header("Access-Control-Allow-Headers","Authorization,Content-Type");
	if (req.method === 'OPTIONS') {
		res.sendStatus(200)
	}
	else {
		next();
	}
}
app.use(enableCors);

const getSample = (req, res) => {
	res.send([
		{
			id:1,
			author:"user1",
			text:"sample text 1"
		},
		{
			id:2,
			author:"user2",
			text:"sample text 2"
		},
		{
			id:3,
			author:"user3",
			text:"sample text 3"
		}
	])
} 

app.get('/sample?', getSample)

require('./src/auth.js')(app)
require('./src/articles.js')(app)
require('./src/profile.js')(app)
require('./src/following.js')(app)

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
     const addr = server.address()
     console.log(`Server listening at http://${addr.address}:${addr.port}`)
})
