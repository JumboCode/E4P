const socket = io();

socket.on('connect', () => {
  console.log('connected to socket with');
});

socket.on('admin matched', admin_matched);

socket.on('chat message', function(data) {
  console.log('recieved chat message on index: ' + data);
  updateChat(createMessage('admin', data.msg));
});

// callback once admin connects to user
function admin_matched() {
  console.log('admin matched');
  // TODO: Frontend should unlock chat input field here
  // start chat protocol

}

function send_message(msg) {
  socket.emit('chat message', {
    message: msg,
    room: socket.id
  });
}

function user_connect() {
  socket.emit('user connect');
};

var chat = {
  userId: 'user1',
  messages: [],
  accepted: true,
  active: false
};


function openChat() {
  document.getElementById("chatbox").style.display = "block";
  document.getElementById("chat-start").style.display = "none";
  
  console.log("attempting to connect");
  user_connect();
}

function getMessage() {
  var message = document.getElementById("message").value;
  var messageObj = createMessage('user', message);
  chat.messages.push(messageObj);
  document.getElementById("message").value="";
  updateChat(messageObj);

  send_message(message);

}

function updateChat(messageObj) {
  messages = document.getElementsByClassName("chatlogs")[0];
  messages.innerHTML = messages.innerHTML + "<div class='chat "+messageObj.role+"'><div class='chat-message'><p>"+messageObj.message+"</p></div></div>";
}


function createMessage(role, messageString) {
  return { role: role, message: messageString, timestamp: new Date() };
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */

