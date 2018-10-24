$(document).ready(() => {

  const socket = io();

  socket.emit('assign as user');

  socket.on('connect', () => {
    $('#user').html(socket.id);
  });

  socket.on('admin matched', admin_matched);

  socket.on('admin disconnect', () => {
    $('#messages').append($('<li>').text('NOTICE: Admin disconnected. Please stand by...'));
  });

  socket.on('wait for admin reconnect', () => {
    console.log('WAIT FOR ADMIN RECONNECT');
    // emit to all admins that user is looking for the same admin to reconnect
    // for one minute
    setIntervalX(function() {
        socket.emit('user waiting for admin reconnect', socket.id);
    }, 5000, 3);
  });

  socket.on('chat message', function(msg) {
    console.log('recieved chat message on index');
    $('#messages').append($('<li>').text(msg));
  });


  // callback once admin connects to user
  function admin_matched() {
    console.log('admin matched');
    $('#messages').append($('<li>').text('NOTICE: Admin matched!'));
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


  // purpose: to be able to call a function X amount of times, repeating
  // every Y milliseconds
  function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = window.setInterval(function () {

       callback();

       if (++x === repetitions) {
           window.clearInterval(intervalID);
       }
    }, delay);
  }



});
