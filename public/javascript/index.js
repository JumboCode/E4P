$(document).ready(() => {

  const socket = io();

  $('#message-form').submit((event) => {
    event.preventDefault();
    console.log($('#message-text').val());
    socket.emit('message', $('#message-text').val());
    $('#message-text').val('');
  });

  socket.on('message', (message) =>{
    $('#messages').append($('<li>').text(message));
  });

});
