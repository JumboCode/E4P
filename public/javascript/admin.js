$(document).ready(() => {

  const socket = io();

  socket.on('user matched', user_matched);

  socket.on('chat message', function(msg) {
    console.log('recieved chat message on admin');
    $('#messages').append($('<li>').text(msg));
  });

  // removes a user from the waiting list
  function user_matched(user) {
    console.log('user matched ' + user);
    // TODO - remove user from whatever list
  }

  socket.on('user disconnect', end_chat);

  // ends a chat with given user
  function end_chat(user) {
    console.log('user disconnected ' + user);
    // TODO - close chat
  }

  socket.on('user waiting', user_waiting);

  function user_waiting(user) {
    console.log('user waiting ' + user);
    // TODO front end stuff
  }

  // RECEIVE ^^^
  ///////////////////////////////////////
  // SEND    vvv

  let user;

  // join entered user's room
  $('#debug').submit((event) => {
    event.preventDefault();
    user = $('#user').val();
    accept_user($('#user').val());
    $('#user').val('');

    socket.emit('room', user);
  });

  // send chat message to server for specific user's room
  let message = document.querySelector('#m');
  $('#form').submit((event) => {
    event.preventDefault();
    $('#messages').append($('<li>').text(message.value)); // display your own message
    send_message(user, message.value);
    message.value = '';
  });

  function send_message(user, msg) {
    socket.emit('chat message', {
      message: msg,
      target: user
    });
  }

  // accepts a waiting user
  function accept_user(user) {
    socket.emit('accept user', user);
  }
});
