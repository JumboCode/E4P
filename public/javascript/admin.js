$(document).ready(() => {
 
    const socket = io();

    if (window.localStorage.getItem('user_id')) {
        console.log('RECONNECT');
        console.log(window.localStorage.getItem('user_id'));
        socket.emit('room', window.localStorage.getItem('user_id'));
    }

    socket.on('connect', () => {
      $('#adminuser').html(socket.id);
    });

  let user;
  let user_socket_id;

  socket.emit('assign as admin');




  socket.on('user matched', user_matched);

  socket.on('user waiting reconnect', (socket_id) => {
      console.log('USER WAITING: ' + socket_id);
      user_socket_id = socket_id;
      console.log('USER SOCKET ID: ' + user_socket_id);
    // $('#messages').append($('<li>').text('There\'s a user waiting to be rematched with an admin!'));
    // TODO: create way for someone to click a link and get auto joined into the chat
    $('#messages').append((
        `<li>
            There's a user waiting to be rematched with an admin!
            Click
            <a id="rejoin" style="cursor: pointer; cursor: hand; color: blue">
                here
            </a>
            to reconnect!
        </li>`));
  });

  let rejoinButton = document.querySelector('#rejoin');

  $('#rejoin').click(function() {
    // join_room(this.user_socket_id);
    console.log('OIAWJEFOAIWEJF');
    join_room(user_socket_id);
  });



  socket.on('chat message', function(msg) {
    console.log('recieved chat message on admin');
    $('#messages').append($('<li>').text(msg));
  });

  // removes a user from the waiting list
  function user_matched(user) {
    console.log('USER MATCHED: ' + user);
    window.localStorage.setItem('user_id', user);
    // TODO - remove user from whatever list
  }

  socket.on('user disconnect', end_chat);

  // ends a chat with given user
  function end_chat(user) {
    console.log('user disconnected:' + user);
    window.localStorage.removeItem('user_id');
    // TODO - close chat
  }

  // RECEIVE ^^^
  ///////////////////////////////////////
  // SEND    vvv



  // join entered user's room
  $('#debug').submit((event) => {
    event.preventDefault();
    user = $('#user').val();
    accept_user($('#user').val());
    $('#user').val('');

    socket.emit('room', user);

    // socket.emit('adminID', {
    //   socketID = socket.id,
    //   target = user
    // });
  });

  // send chat message to server for specific user's room
  let message = document.querySelector('#m');
  $('#form').submit((event) => {
    event.preventDefault();
    $('#messages').append($('<li>').text(message.value)); // display your own message
    socket.emit('chat message', {
      message: message.value,
      target: user
    });
    message.value = '';
  });

  // accepts a waiting user
  function accept_user(user) {
    socket.emit('accept user', user);
  }

  function join_room(room) {
      console.log('---ROOM ROOM ROOM: ' + room);
    socket.emit('accept user', room);
  }

});
