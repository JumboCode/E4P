/*
 *  GET:
 *    x /admin
 *    x /admin/login
 *    - /admin/logout
 *    - /admin/wait
 *    - /admin/change/request
 *    - /admin/change
 *
 *  POST:
 *    x /admin/login
 *    - /admin/change/request
 *    - /admin/change
 */

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

describe('AUTH TESTS', () => {

  it('should get /admin/login', (done) => {
    chai.request(server)
        .get('/admin/login')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
    });
  });

  it('should post /admin/login and redirect to /admin if successful', (done) => {
    chai.request(server)
        .post('/admin/login')
        .redirects(0)
        .set('content-type', 'application/json')
        .send({
          username: process.env.TEST_USER || 'jumbocode',
          password: process.env.TEST_PASS || 'mattlangan'
      }).end((err, res) => {
          res.should.have.status(302);
          res.should.have.header('location', '/admin');
          done();
    });
  });

  it('should post /admin/login and redirect to /admin/login if unsucessful', (done) => {
    chai.request(server)
        .post('/admin/login')
        .redirects(0)
        .set('content-type', 'application/json')
        .send({
          username: 'DNE',
          password: 'DNE'
      }).end((err, res) => {
          res.should.have.status(302);
          res.should.have.header('location', '/admin/login');
          done();
    });
  });
  
  it('should not get /admin/login and redirect to /admin if logged in', (done) => {
    let agent = chai.request.agent(server);
    
    agent.post('/admin/login')
        .set('content-type', 'application/json')
        .send({
          username: process.env.TEST_USER || 'jumbocode',
          password: process.env.TEST_PASS || 'mattlangan'
      }).end((err, res) => {
          return agent.get('/admin/login')
                      .redirects(0)
                      .end((err, res) => {
                        res.should.have.status(302);
                        res.should.have.header('location', '/admin');
                        agent.close();
                        done();
          });
    });
  });

  it('should get /admin and not redirect if logged in', (done) => {
    let agent = chai.request.agent(server);
    
    agent.post('/admin/login')
        .set('content-type', 'application/json')
        .send({
          username: process.env.TEST_USER || 'jumbocode',
          password: process.env.TEST_PASS || 'mattlangan'
      }).end((err, res) => {
          return agent.get('/admin')
                      .redirects(0)
                      .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.html;
                        agent.close();
                        done();
          });
    });
  });

  it('should not get /admin and redirect to /admin/login if not logged in', (done) => {
    chai.request(server)
        .get('/admin')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.should.have.header('location', '/admin/login');
          done();
    });
  });
});
