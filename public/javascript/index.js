$(document).ready(() => {

  const socket = io();

  socket.on('connect', () => {
    $('#user').html(socket.id);
  });

  socket.on('admin matched', admin_matched);

  // callback once admin connects to user
  function admin_matched() {
    console.log('admin matched')
    // TODO - start chat protocol
  }
});
