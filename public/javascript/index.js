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

$(document).ready(() => {
  const availableUI = `
      <div class='row'>Ears for Peers</div>
      <img src='img/baby_elephant.png'>
      <div class='row align-items-center'>
        <button type='button' class="btn btn-outline-info" onclick='openChat()'>Connect Me to an Ear</button>
      </div>
      <p id='footer' style="font-size: 16px">To reach out to Ears for Peers, see their <a href="http://sites.tufts.edu/ears4peers/contact-us">Contact Us Page</a>.</p>
    `;
  const unavailableUI = `
      <div class='row'>Ears for Peers</div>
      <img src='img/baby_elephant.png'>
      <p style="font-size: 16px">Ears for Peers is currently unavailable. </p>
      <p style="font-size: 16px">Our line is open from 7pm-7am every night, unless we tell you otherwise on our <a href="https://www.facebook.com/ears4peers/">Facebook Page</a>.</p>
    `;
  $.getJSON('/available')
    .done((data) => {
      if (data.isAvailable) {
        $('#open').html(availableUI);
      } else {
        $('#open').html(unavailableUI);
      }
    })
    .fail(() => {
      $('#open').html(unavailableUI);
    });
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
  console.log('Admin left!');
  // admin has disconnected, do something
  // updateChat(createMessage('admin', 'ALERT: Admin disconnected!'));
});

socket.on('chat message', (data) => {
  console.log('recieved chat message on index: ' + data);
  updateChat(createMessage('admin', data.message));
  $('#typingIcon').css('display', 'none');
  messageSound();
});

socket.on('typing', () => {
  console.log('admin is typing');
  $('#typingIcon').css('display', 'block');
  scrollDown();
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
}

function user_connect() {
  console.log(socket);
  socket.emit('user connect');
}

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
  return 'Are you sure you want to leave?';
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
  open.innerHTML = " <div class='container-fluid text-center'>Waiting to connect to an ear!</div><div class='row'><div class='loader' id='load'></div></div>";
  console.log("attempting to connect");
  window.onbeforeunload = () => {
    return 'Are you sure you want to leave? Your chat connection will be lost.';
  };
  
  // User is connecting: Fix the current room id in localStorage and the chat object:
  window.localStorage.setItem('roomID', socket.id);
  chat.roomId = socket.id;

  user_connect();
  chat.active = true;
}

function startChat() {
  // get rid of open buttons
  let openPanel = document.getElementById('open');
  openPanel.innerHTML = '';
  openPanel.style.display = 'none';


  //add input bar to page
  $('#e_space').css('height', '10vh');
  $('#chat').attr('style', 'display: flex !important');
  chatbox = document.getElementById('chatbox');
  chatbox.style.display = 'block';

  chatbar = document.getElementById('chatbar');
  chatbar.style.visibility= 'visible';
  chat.accepted = true;

  $('#typingIcon').before(createStatusDiv('An Ear has accepted your conversation.'));
  $('#typingIcon').before(createStatusDiv('Talk to us about anything that\'s on your mind.'));
}


function getMessage() {
  sendMessage();
  window.onbeforeunload = warning;
}

function scrollDown() {
  let mbox = $('#chathistory');
  mbox.scrollTop(mbox.prop('scrollHeight') - mbox.prop('clientHeight'));
}

function updateChat(messageObj) {
  let messages = document.getElementById('chathistory');
  const messageSide = (messageObj.role == 'admin' ? 'left' : 'right');
  const newMessage = createMessageDiv(messageSide, messageObj.message, messageObj.timestamp);
  $('#typingIcon').before(newMessage);
  scrollDown();
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

function admin_matched() {
  startChat();
  console.log('admin matched');
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */

$(() => {
  $('#type_msg').html(chatElements(''));
  chatSetup(sendMessage);
});
