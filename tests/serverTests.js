//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

//////////////////////////////////////////////////////////////////
// Default Router GET Tests
//////////////////////////////////////////////////////////////////

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

  it('it should GET /help', (done) => {
    chai.request(server)
        .get('/help')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
    });
  });

  it('it should not GET /notapage', (done) => {
    chai.request(server)
        .get('/notapage')
        .end((err, res) => {
          res.should.have.status(404);
          res.should.be.html;
          done();
    });
  });

  it('it should not GET /admin.html', (done) => {
    chai.request(server)
        .get('/admin.html')
        .end((err, res) => {
          res.should.have.status(404);
          res.should.be.html;
          done();
    });
  });

  it('it should not GET /public/admin.html', (done) => {
    chai.request(server)
        .get('/public/admin.html')
        .end((err, res) => {
          res.should.have.status(404);
          res.should.be.html;
          done();
    });
  });

  it('it should not GET /./admin.html', (done) => {
    chai.request(server)
        .get('/./admin.html')
        .end((err, res) => {
          res.should.have.status(404);
          res.should.be.html;
          done();
    });
  });
});

//////////////////////////////////////////////////////////////////
// Admin Router GET Tests
//////////////////////////////////////////////////////////////////

// TODO these tests don't really check what pages are returned, just that
// pages are always returned so we should really create more specific tests.
describe('GET /admin', () => {
  it('it should GET /admin', (done) => {
    chai.request(server)
        .get('/admin')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
    });
  });

  it('it should GET /admin/login', (done) => {
    chai.request(server)
        .get('/admin/login')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
    });
  });
});

//////////////////////////////////////////////////////////////////
// POST Tests
//////////////////////////////////////////////////////////////////

// TODO these tests don't really check what pages are returned, just that
// pages are always returned so we should really create more specific tests.
/*describe('POST /', () => {
  it('it should POST /admin/login', (done) => {
    chai.request(server)
        .post('/admin/login')
        .set('content-type', 'application/json')
        .send({username: 'foo', password: 'bar'})
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
    });
  });
});
*/