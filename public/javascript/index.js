let socket = io();

function connectWithStoredID() {
  let prevRoomID = window.localStorage.getItem('roomID');
  console.log('Prev room id: ' + prevRoomID);

  if (prevRoomID !== '') {
    console.log('Reconnecting with: ' + prevRoomID);

    // user needs to reconnect using localStorage ID
    socket.emit('user reconnect', prevRoomID);
  }
}

socket.on('test', () => {
  console.log('test');
});

socket.on('connect', () => {
  if (chat.active) {
    console.log('Chat is active, connecting with stored ID');
    connectWithStoredID();
  }
});

socket.on('invalid old socket id', () => {
  /* TODO: Tell user that their chat is not valid anymore (convert console
      log into a displayed message.)
      
      This function only gets called when a user was in the middle of a 
      conversation. If the user presses the "Connect me to an Ear" button,
      their id is saved in localStorage, and this function does not get 
      called until after they disconnect during a conversation.
  */
  console.log('Tried to reconnect, but your conversation seems to be too old. ' + 
              'You usually cannot disconnect for more than 5 minutes');

  window.localStorage.setItem('roomID', socket.id);
});

socket.on('admin matched', () => {
  startChat();
  console.log('admin matched');
});

socket.on('admin disconnect', () => {
  console.log("Admin left!");
  // admin has disconnected, do something
  // updateChat(createMessage('admin', 'ALERT: Admin disconnected!'));
});

socket.on('chat message', function(data) {
  updateChat(createMessage('admin', data.message));
  $('#typingIcon').css('display', 'none');
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
    room: chat.roomId
  });
};

function user_connect() {
  console.log(socket)
  socket.emit('user connect');
};

socket.emit('assign as user');

function send_typing_message(is_typing) {
  if (is_typing) {
    socket.emit('typing', {
      room: chat.roomId
    });
  } else {
    socket.emit('stop typing', {
      room: chat.roomId
    });
  }
}

function warning() {
  return "Are you sure you want to leave?";
}

var chat = {
  roomId: '',
  messages: [],
  accepted: false,
  active: false
};


function openChat() {
  open = document.getElementById("open");
  open.innerHTML = '';
  open.innerHTML = " <div class='row'>Waiting to connect to an ear!</div><div class='row'><div class='loader' id='load'></div></div>";
  console.log("attempting to connect");
  window.onbeforeunload = () => {
    return "Are you sure you want to leave? Your chat connection will be lost.";
  }
  
  // User is connecting: Fix the current room id in localStorage and the chat object:
  window.localStorage.setItem('roomID', socket.id);
  chat.roomId = socket.id;

  user_connect();
  chat.active = true;
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

function admin_matched() {
  startChat();
  console.log('admin matched');
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */

$(function() {
  $("#type_msg").html(chatElements(""));
  chatSetup(sendMessage);
});

function disconnect() {
  socket.disconnect();
  socket.connect({'forceNew':true });
}
