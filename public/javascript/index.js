// var io = require('socket.io')(http);
var socket = io();

console.log("okaokaokaoajoawe");
let form = document.querySelector('.form');
form.addEventListener('submit', function() {
    socket.emit('message');
});


let message = document.querySelector('#message');
let btn = document.getElementById('send');
btn.addEventListener('click', function() {
    socket.emit('chat', {
        message: message.value,
    });
});

socket.on('chat', function(msg) {

});


// io.on('connection', function(socket){
//   // console.log('a user connected');
//   io.emit('TEST', 'can you hear me?');
//   socket.on('message', function (from, msg) {
//    console.log('I received a private message by ', from, ' saying ', msg);
//  });
// });
//
// http.listen(3000, function(){
//   console.log('listening on *:131313000');
// });
