let socket = io();

let PREV_ROOM_ID = '';

function retrieveLocalStorage() {
  PREV_ROOM_ID = window.localStorage.getItem('roomID');
  if (PREV_ROOM_ID) {
    // retrieve local storage if it exists
    // ROOM_ID = localStorage.getItem('roomID');
    console.log('Reconnected with: ' + PREV_ROOM_ID);

    // user needs to reconnect using localStorage ID
    socket.emit('user reconnect', PREV_ROOM_ID, socket.id);
    // startChat();
    }
}

socket.on('connect', () => {
  console.log('connected to socket');
  retrieveLocalStorage();
});

socket.on('admin matched', () => {
  startChat();
  console.log('Prev room id: ' + PREV_ROOM_ID);
  if (!PREV_ROOM_ID) {
    console.log('No previous room id')
    window.localStorage.setItem('roomID', socket.id);
  }
  else {
      console.log('FOUND previous room id');
  }
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
    room: socket.id
  });
};

function user_connect() {
  socket.emit('user connect');
};

socket.emit('assign as user');

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



function resetStorage() {
  window.localStorage.removeItem('roomID');
}

function disconnect() {
  socket.disconnect();
  socket = io();
  console.log('here');
}
