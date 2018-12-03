const socket = io();

socket.on('connect', () => {
  console.log('connected to socket with');
});

socket.on('admin matched', admin_matched);

socket.on('chat message', function(data) {
  console.log('recieved chat message on index: ' + data);
  updateChat(createMessage('admin', data.message));
});

// callback once admin connects to user
function admin_matched() {
  startChat();
  console.log('admin matched');
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

function warning() {
  return "Are you sure you want to leave?";
}

var chat = {
  userId: 'user1',
  messages: [],
  accepted: false,
  active: true
};


function openChat() {
  open = document.getElementById("open");
  open.innerHTML = '';
  open.innerHTML = " <div class='row'>Waiting to connect to an ear!</div><div class='row'><div class='loader' id='load'></div></div>";
  console.log("attempting to connect");
  user_connect();
}

function startChat() {
  // get rid of open buttons
  open = document.getElementById("open");
  open.innerHTML = '';
  open.style.display = "none";


  //add input bar to page
  a_chat = document.getElementById("chat");
  a_chat.style.display = "block";
  chatbox = document.getElementById("chatbox");
  chatbox.style.display = "block";
  
  chatbar = document.getElementById("chatbar");
  chatbar.style.visibility= "visible";
  chat.accepted = true;
}


function getMessage() {

  var box = document.getElementById("chatbox");
  box.scrollTop = box.scrollHeight;
  var message = document.getElementById("msg").value;
  var messageObj = createMessage('user', message);
  chat.messages.push(messageObj);
  document.getElementById("msg").value="";
  updateChat(messageObj);
  send_message(message);
  window.onbeforeunload = warning;
}


function updateChat(messageObj) {
  messages = document.getElementById("chathistory");
  chatbox = document.getElementById("chatbox");
  if (messageObj.role == 'admin') {
      messageSide = 'left';
      //newMessage = "<div class='chat_admin'><div class='received_msg'><p>"+messageObj.message+"</p></div></div>"
  }
  else {
      console.log(messageObj.message);
      messageSide = 'right';
      //newMessage = "<div class='chat_user'><div class='sent_msg'><p>"+messageObj.message+"</p></div></div>"
  }
  newMessage = createMessageDiv(messageSide, messageObj.message);
  console.log(messages.innerHTML);
  messages.innerHTML = messages.innerHTML + newMessage;


}


function createMessage(role, messageString) {
  return { role: role, message: messageString, timestamp: new Date() };
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */

