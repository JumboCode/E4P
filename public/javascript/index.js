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

function send_typing_message(is_typing) {
  if (is_typing == true) {
    socket.emit('typing', {
      room: socket.id
    });
  } else {
    socket.emit('stop typing', {
      room: socket.id
    });
  }
}

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
  window.onbeforeunload = () => {
    return "Are you sure you want to leave? Your chat connection will be lost.";
  }

  user_connect();
}

function startChat() {
  // get rid of open buttons
  open = document.getElementById("open");
  open.innerHTML = '';
  open.style.display = "none";


  //add input bar to page
  $("#e_space").css('height', '10vh');
  $("#chat").attr('style', 'display: flex !important');
  chatbox = document.getElementById("chatbox");
  chatbox.style.display = "block";

  chatbar = document.getElementById("chatbar");
  chatbar.style.visibility= "visible";
  chat.accepted = true;
}


function getMessage() {
  sendMessage();
  window.onbeforeunload = warning;
}


function updateChat(messageObj) {
  messages = document.getElementById("chathistory");
  chatbox = document.getElementById("chatbox");
  if (messageObj.role == 'admin') {
      messageSide = 'left';
  }
  else {
      messageSide = 'right';
  }
  newMessage = createMessageDiv(messageSide, messageObj.message);
  messages.innerHTML = messages.innerHTML + newMessage;
  messages.scrollTop = messages.scrollHeight - messages.clientHeight;
}


function createMessage(role, messageString) {
  return { role: role, message: messageString, timestamp: new Date() };
}

function sendMessage() {
    message = $('#inputBox').val();
    if (message != '') {
        send_message(message);
        messageObject = createMessage('user', message);
        chat.messages.push(messageObject);
        updateChat(messageObject);
        message = $('#inputBox').val('');
    }
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */

$(function() {
  $("#type_msg").html(chatElements(""));
  chatSetup(sendMessage);
});
