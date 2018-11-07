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
                res.should.be.html;
	          done();
	    });
  	});

  	it('it should not GET /allelse', (done) => {
    	chai.request(server)
	        .get('/allelse')
	        .end((err, res) => {
	              res.should.have.status(404);
                res.should.be.html;
	          done();
	    });
  	});

    it('it should GET /admin', (done) => {
      chai.request(server)
          .get('/admin')
          .end((err, res) => {
                res.should.have.status(200);
                res.should.be.html;
            done();
      });
    });

    it('it should GET /login', (done) => {
      chai.request(server)
          .get('/login')
          .end((err, res) => {
                res.should.have.status(200);
                res.should.be.html;
            done();
      });
    });

    it('it should GET /help', (done) => {
      chai.request(server)
          .get('/help')
          .end((err, res) => {
                res.should.have.status(200);
                res.should.be.html;
            done();
      });
    });
});

describe('POST /', () => {
	it('it should POST /login', (done) => {
    	chai.request(server)
	        .post('/login')
	        .set('content-type', 'application/json')
			.send({username: 'foo', password: 'bar'})
	        .end((err, res) => {
	          res.should.have.status(200);
	          res.text.should.equal('success')
	          done();
	    });
  	});
});
