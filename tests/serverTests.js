//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

/*
 * Server Tests
 */
describe('GET /', () => {
  	it('it should GET /', (done) => {
    	chai.request(server)
	        .get('/')
	        .end((err, res) => {
	              res.should.have.status(200);
	          done();
	    });
  	});

  	it('it should not GET /allelse', (done) => {
    	chai.request(server)
	        .get('/allelse')
	        .end((err, res) => {
	              res.should.have.status(404);
	          done();
	    });
  	});
});
