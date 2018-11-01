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
  accepted: false,
  active: true
};

function initialize() {
  document.getElementsBy

}
function openChat() {  
  document.getElementById("chat").style.display = "block";
  document.getElementById("open").style.display = "none";
  document.getElementById("topnav").style.backgroundColor = "#B1C6C4";

  
  console.log("attempting to connect");
  user_connect();
}

function getMessage() {
  var message = document.getElementById("msg").value;
  console.log(message);
  var messageObj = createMessage('user', message);
  chat.messages.push(messageObj);
  document.getElementById("msg").value="";
  updateChat(messageObj);

  send_message(message);

}

function updateChat(messageObj) {
  messages = document.getElementsByClassName("chat_history")[0];
  console.log(messageObj.role);
  console.log(messages)
  if (messageObj.role == 'admin') {
      newMessage = "<div class='chat_admin'><div class='received_msg'><p>"+messageObj.message+"</p></div></div>"
  }
  else {
      console.log(messageObj.message);
      newMessage = "<div class='chat_user'><div class='sent_msg'><p>"+messageObj.message+"</p></div></div>"
  }
  console.log(messages.innerHTML);
  messages.innerHTML = messages.innerHTML + newMessage;
}


function createMessage(role, messageString) {
  return { role: role, message: messageString, timestamp: new Date() };
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */

