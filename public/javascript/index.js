const socket = io();

socket.on('connect', () => {
  console.log('connected to socket');
});

socket.on('admin matched', () => {
  startChat();
  console.log('admin matched');
});

socket.on('chat message', function(data) {
  console.log('recieved chat message on index: ' + data);
  updateChat(createMessage('admin', data.message));
  $('#typingIcon').css('display', 'none');
  alertSound();
});

socket.on('typing', () => {
  console.log('admin is typing');
  $('#typingIcon').css('display', 'block');
});

socket.on('stop typing', () => {
  console.log('admin stopped typing');
  $('#typingIcon').css('display', 'none');
});

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
  if (is_typing) {
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
  $("#typingIcon").before(newMessage);
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

function alertSound() {
    let audio = new Audio('audio/alert.mp3');
    audio.play();
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */

$(function() {
  $("#type_msg").html(chatElements(""));
  chatSetup(sendMessage);
});
