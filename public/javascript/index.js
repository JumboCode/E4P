$(document).ready(() => {

  const socket = io();

  socket.on('connect', () => {
    $('#user').html(socket.id);
  });

  socket.on('admin matched', admin_matched);

  socket.on('chat message', function(msg) {
    console.log('recieved chat message on index');
    $('#messages').append($('<li>').text(msg));
  });

  // callback once admin connects to user
  function admin_matched() {
    console.log('admin matched');
    // start chat protocol
  }

  // send chat message to server for user's own room
  message = document.querySelector('#m');
  $('form').submit(function(e) {
    e.preventDefault();
    $('#messages').append($('<li>').text(message.value)); // display your own message
    socket.emit('chat message', {
      message: message.value,
      target: socket.id
    });
    message.value = '';
  });

});
