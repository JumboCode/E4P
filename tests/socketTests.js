//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let server = require('../server').server;
let http = require('http')
// const server = http.createServer(app);
let io = require('socket.io-client')
let should = chai.should();

const url = 'localhost:3000/';
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
    console.log("hi")
    server.listen(3000, () => {console.log('start')});
    setTimeout(() => {
    admin1 = io(url, ioOpts);
    console.log(admin1)
    admin2 = io(url, ioOpts);
    user1 = io(url, ioOpts);
    user2 = io(url, ioOpts);
    console.log("bye")
    done();
    }, 1000);
  });

  describe('user connect', () => {
    it('should notify all admins a user connected', (done) => {
      user1.emit('user connect');
      admin1.on('user waiting', (id1) => {
        expect(id1).to.equal(user1.id);
        done();
        // admin2.on('user waiting', (id2) => {
        //   expect(id2).to.equal(user1.id);
        //   done();
        // });
      });
    });
  });
});
