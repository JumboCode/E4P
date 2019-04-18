/*
 *  GET:
 *    x /admin
 *    x /admin/login
 *    x /admin/logout
 *    x /admin/change/request
 *    x /admin/change
 *    x /admin/wait
 *
 *  POST:
 *    x /admin/login
 *    x /admin/change/request
 *    x /admin/change
 */

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.maxAttempts = 2;
process.env.FIRSTLOGIN = 'true';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

describe('AUTH TESTS', () => {
  it('should setup the test account by posting to /admin/first', (done) => {
    chai.request(server)
      .post('/admin/first')
      .redirects(0)
      .set('content-type', 'application/json')
      .send({
        username: 'foo',
        email: 'user@email.com',
        new_pwd: 'bar',
        chk_pwd: 'bar'
      }).end((err, res) => {
        res.should.have.status(302);
        res.should.have.header('location', '/admin/logout');
        done();
      });
  });

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
        username: 'foo',
        password: 'bar'
      }).end((err, res) => {
        res.should.have.status(302);
        res.should.have.header('location', '/admin');
        done();
      });
  });
  
  it('should not get /admin/login and redirect to /admin if logged in', (done) => {
    let agent = chai.request.agent(server);
    
    agent.post('/admin/login')
      .set('content-type', 'application/json')
      .send({
        username: 'foo',
        password: 'bar'
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
        username: 'foo',
        password: 'bar'
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

  it('should get /admin/logout and redirect to /admin/login if logged in', (done) => {
    let agent = chai.request.agent(server);
    
    agent.post('/admin/login')
      .set('content-type', 'application/json')
      .send({
        username: 'foo',
        password: 'bar'
      }).end((err, res) => {
        return agent.get('/admin/logout')
          .redirects(0)
          .end((err, res) => {
            res.should.have.status(302);
            res.should.have.header('location', '/admin/login');
            agent.close();
            done();
          });
      });
  });

  it('should get /admin/logout and redirect to /admin/login if not logged in', (done) => {
    chai.request(server)
      .get('/admin/logout')
      .redirects(0)
      .end((err, res) => {
        res.should.have.status(302);
        res.should.have.header('location', '/admin/login');
        done();
      });
  });

  it('should get /admin/change/request', (done) => {
    chai.request(server)
      .get('/admin/change/request')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });

  it('should post /admin/change/request and redirect to logout if good email', (done) => {
    chai.request(server)
      .post('/admin/change/request')
      .redirects(0)
      .set('content-type', 'application/json')
      .send({
        email: 'user@email.com',
      }).end((err, res) => {
        res.should.have.status(302);
        res.should.have.header('location', '/admin/logout');
        done();
      });
  });

  it('should post /admin/change/request and redirect to logout if bad email', (done) => {
    chai.request(server)
      .post('/admin/change/request')
      .redirects(0)
      .set('content-type', 'application/json')
      .send({
        email: 'DNE',
      }).end((err, res) => {
        res.should.have.status(302);
        res.should.have.header('location', '/admin/logout');
        done();
      });
  });

  it('should get /admin/change and send back invalid page', (done) => {
    chai.request(server)
      .get('/admin/change')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });

  it('should get /admin/wait', (done) => {
    chai.request(server)
      .get('/admin/wait')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });
});
