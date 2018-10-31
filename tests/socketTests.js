//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let expect = require('chai').expect;
let server = require('../server');
let http = require('http')
let io = require('socket.io-client')
let should = chai.should();

let chaiHttp = require('chai-http');

chai.use(chaiHttp);

/*
 * Set up server
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
});

const url = 'http://localhost:3000/';
const ioOpts = {
  transports: ['websocket'],
  forceNew: true,
  // reconnection: false
}

/*
 * Default behavior of every socket test
 * don't change these
 */
describe('socket tests', () => {
  beforeEach((done) => {
    admin1 = io(url, ioOpts);
    admin2 = io(url, ioOpts);
    user1 = io(url, ioOpts);
    user2 = io(url, ioOpts);
    done();
  });

  afterEach(function(done) {
    // disconnect io clients after each test
    admin1.disconnect();
    admin2.disconnect();
    user1.disconnect();
    user2.disconnect();

    done()
  });

  // Socket Tests
  describe('user connect', () => {
    it('should notify all admins a user connected', (done) => {
      adminsNotified = 0;
      admin1.on('user waiting', (id1) => {
        expect(id1).to.equal(user1.id);
        adminsNotified++;
        if (adminsNotified == 2) {
          done();
        }
      });

      admin2.on('user waiting', (id1) => {
        expect(id1).to.equal(user1.id);
        adminsNotified++;
        if (adminsNotified == 2) {
          done();
        }
      });

      // wait 50 ms to let receiver create on message event handler
      setTimeout(function(){ user1.emit('user connect'); }, 50);
    });

    // TODO: Add more socket tests here like the one above
  });
});
