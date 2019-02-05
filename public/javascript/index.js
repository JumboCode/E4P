/* eslint-disable no-undef */
const socket = io();

window.onload = () => {
  generateUserHeader();
  $('#openchat').click(openChat);
};

socket.on('connect', () => {
  console.log('connected to socket with');
});

socket.on('admin matched', () => {
  startChat();
  console.log('admin matched');
});

socket.on('chat message', (data) => {
  console.log('recieved chat message on index: ' + data);
  updateChat(createMessage('admin', data.message));
  $('#typingIcon').css('display', 'none');
});

socket.on('typing', () => {
  $('#typingIcon').css('display', 'block');
});

socket.on('stop typing', () => {
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
}

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
  return 'Are you sure you want to leave?';
}

var chat = {
  userId: 'user1',
  messages: [],
  accepted: false,
  active: true
};


function openChat() {
  let open = $('#open');
  open.empty();
  open.html('<div class=\'row\'>Waiting to connect to an ear!</div><div class=\'row\'><div class=\'loader\' id=\'load\'></div></div>');
  console.log('attempting to connect');
  window.onbeforeunload = () => {
    return 'Are you sure you want to leave? Your chat connection will be lost.';
  };

  user_connect();
}

function startChat() {
  // get rid of open buttons
  let open = $('#open');
  open.empty();
  open.attr('style', 'display: none');

  //add input bar to page
  $('#e_space').css('height', '10vh');
  $('#chat').attr('style', 'display: flex !important');

  $('#chatbox').attr('style', 'display: block');
  $('#chatbar').attr('style', 'visibility: visible');
}


function getMessage() {
  sendMessage();
  window.onbeforeunload = warning;
}


function updateChat(messageObj) {
  let messages = $('#chathistory');
  let messageSide = messageObj.role == 'admin' ? 'left' : 'right';
  let newMessage = createMessageDiv(messageSide, messageObj.message);
  $('#typingIcon').before(newMessage);
  messages.scrollTop(messages.prop('scrollHeight') - messages.prop('clientHeight'));
}


function createMessage(role, messageString) {
  return { role: role, message: messageString, timestamp: new Date() };
}

function sendMessage() {
  let message = $('#inputBox').val();
  if (message != '') {
    send_message(message);
    let messageObject = createMessage('user', message);
    chat.messages.push(messageObject);
    updateChat(messageObject);
    message = $('#inputBox').val('');
  }
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */

$(() => {
  $('#type_msg').html(chatElements(''));
  chatSetup(sendMessage);
});
