/*
 * Test suite for articles.js
 */
const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

const url = (endpoint) => `http://localhost:3000/${endpoint}`

describe('Validate Article functionality', () => {

	it ('should unit test to validate POST /article', (done) => {
		let loginpayload = {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({username:'testuser',password:'pass-pass-pass'})
		}

		fetch(url('login'),loginpayload)
		.then(res => {
			expect(res.status).to.equal(200)

			fetch(url('articles'))
			.then(res => res.json())
			.then(res => {
				return res.articles.length
			})
			.then(before_count => {
				let postpayload = {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({text:"spec test"})
				}
				fetch(url('article'),postpayload)
				.then(res => {
					res.json()
				})
				.then(_ => {
					fetch(url('articles'))
					.then(res => res.json())
					.then(res => {
						expect(res.articles.length).to.equal(before_count + 1)
						done()
					})
				})
			})
		})

		
	})
});
