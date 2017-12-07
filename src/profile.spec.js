/*
 * Test suite for profile.js
 */
const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

const url = (endpoint) => `http://localhost:3000/${endpoint}`

describe('Validate Headline functionality', (done) => {

	it ('should unit test to validate PUT /headline', (done) => {
		let loginpayload = {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({username:'testuser',password:'pass-pass-pass'})
		}
		fetch(url('login'),loginpayload)
		.then(res => {
			expect(res.status).to.equal(200)
			fetch(url('headlines/testuser'))
			.then(res => res.json())
			.then(res => {
				return res.headlines[0].headline
			})
			.then(oldheadline => {
				let headlinepayload = {
					method: 'PUT',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({headline:"spec test"})
				}
				fetch(url('headline'),headlinepayload)
				.then(res => res.json())
				.then(res => {
					expect(res.headline).to.equal("spec test")
					expect(res.headline).to.not.equal(oldheadline)
					done()
				})
			})
		})
	})
});
