//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let expect = require('chai').expect;
let should = chai.should();
let server = require('../server');
let admins = require('../server').admins;
let currentConversations = require('../server').currentConversations;
let chaiHttp = require('chai-http');
chai.use(chaiHttp);

let io = require('socket.io-client')

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
 * Socket Tests
 */
describe('socket tests', () => {
  beforeEach((done) => {
    admin1 = io(url, ioOpts);
    admin1.on('connect', () => {
      admins.push(admin1.id)
    });

    admin2 = io(url, ioOpts);
    admin2.on('connect', () => {
      admins.push(admin2.id)
    });

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

  describe('Phase 1: Initial User Connect', () => {
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
      setTimeout(() => { user1.emit('user connect'); }, 50);
    });
  });

  describe('Phase 2: Admin Pick Up', () => {
    it('should notify the user and every other admin that user was picked up', (done) => {
      // setup connections
      admin1.on('user waiting', (id1) => {
        admin1.emit('accept user', id1);
      });

      // admin/user matching messages
      admin_notified = false;
      user_notified = false;
      admin2.on('user matched', (id1) => {
        expect(id1).to.equal(user1.id);
        admin_notified = true;
        if (admin_notified && user_notified) {
          done();
        }
      });

      user1.on('admin matched', () => {
        user_notified = true;
        if (admin_notified && user_notified) {
          done();
        }
      });

      setTimeout(() => { user1.emit('user connect'); }, 50);
    });
  });

  describe('Phase 3: Chat', () => {
    it('should send messages back and forth between admin and user', (done) => {
      // setup connections
      admin1.on('user waiting', (id1) => {
        admin1.emit('accept user', id1);
      });

      user1.on('admin matched', () => {
        user1.emit('chat message', { message: 'foobar', room: user1.id });
      });

      // chat messages
      admin1.on('chat message', (msg) => {
        expect(msg.message).to.equal('foobar');
        expect(msg.room).to.equal(user1.id);
        admin1.emit('chat message', { message: 'sgobos', room: msg.room });
      });

      user1.on('chat message', (msg) => {
        expect(msg.message).to.equal('sgobos');
        expect(msg.room).to.equal(user1.id);
        done();
      });

      setTimeout(() => { user1.emit('user connect'); }, 50);
    });
  });

  describe('User Typing Messages', () => {
    it('should send typing notices back and forth between admin and user', (done) => {
      // setup connections
      admin1.on('user waiting', (id1) => {
        admin1.emit('accept user', id1);
      });

      user1.on('admin matched', () => {
        user1.emit('typing', { room: user1.id });
      });

      // chat messages
      admin1.on('typing', (msg) => {
        expect(msg.room).to.equal(user1.id);
        admin1.emit('typing', { room: msg.room });
      });

      user1.on('typing', (msg) => {
        expect(msg.room).to.equal(user1.id);
        done();
      });

      setTimeout(() => { user1.emit('user connect'); }, 50);
    });
  });
  
  describe('User Stop Typing Messages', () => {
    it('should send stop typing notices back and forth between admin and user', (done) => {
      // setup connections
      admin1.on('user waiting', (id1) => {
        admin1.emit('accept user', id1);
      });

      user1.on('admin matched', () => {
        user1.emit('stop typing', { room: user1.id });
      });

      // chat messages
      admin1.on('stop typing', (msg) => {
        expect(msg.room).to.equal(user1.id);
        admin1.emit('stop typing', { room: msg.room });
      });

      user1.on('stop typing', (msg) => {
        expect(msg.room).to.equal(user1.id);
        done();
      });

      setTimeout(() => { user1.emit('user connect'); }, 50);
    });
  });

  describe('Update currentConversations', () => {
    it('should add conversation to currentConversations', (done) => {
      admin1.on('user waiting', (id1) => {
        admin1.emit('accept user', id1);
        expect(currentConversations.length).to.equal(1);
        expect(currentConversations[0].user).to.equal(currentConversations[0].room);
        done();
      });
      
      setTimeout(() => { user1.emit('user connect'); }, 50);
    });
  });

});
