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


$(document).ready(() => {
  const availableUI = `
      <div class='row'>Ears for Peers</div>
      <img src='img/baby_elephant.png'>
      <div class='row align-items-center'>
        <button type='button' class="btn btn-outline-info" onclick='openChat()'>Connect Me to an Ear</button>

      </div>
    `;
  const unavailableUI = `
      <div class='row'>Ears for Peers</div>
      <img src='img/baby_elephant.png'>
      <p style="font-size: 16px">Ears for Peers is currently unavailable. </p>
      <p class='container-fluid text-center' style="font-size: 16px">Our line is open from 7pm-2am every night, unless we tell you otherwise on our <a href="https://www.facebook.com/ears4peers/">Facebook Page</a>.</p>
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

socket.on('reconnected with old socket id', () => {
  $('#typingIcon').before(createStatusDiv('You\'ve been reconnected to your chat.'));
  $('#typingIcon').before(createStatusDiv('Keep this browser window open to receive and send messages.'));
});

socket.on('invalid old socket id', () => {
  /* 
      This function only gets called when a user was in the middle of a
      conversation. If the user presses the "Connect me to an Ear" button,
      their id is saved in localStorage, and this function does not get
      called until after they disconnect during a conversation.
  */
  deactivateChat();
  $('#typingIcon').before(createStatusDiv('Tried to reconnect, but your conversation seems to be too old. ' +
                                          'You usually cannot disconnect for more than 60 minutes.'));
  $('.input-group').html('<a id="goHomeLink" href="/"><div id="delete">Take me back to the home page</div></a>');

  window.localStorage.setItem('roomID', socket.id);
});

socket.on('admin matched', () => {
  startChat();
  console.log('admin matched');
  $('#typingIcon').css('display', 'none');
});

socket.on('admin disconnect', () => {
  console.log('Admin left!');
  // admin has disconnected, do something
  // updateChat(createMessage('admin', 'ALERT: Admin disconnected!'));
});

socket.on('chat message', (data) => {
  updateChat(createMessage('admin', data.message, new Date(data.timestamp)));
  $('#typingIcon').css('display', 'none');
  messageSound();
  //if we're looking at the message as it comes in, send RR
  if(isChatHistBottom() && document.hasFocus()) {
    readMostRecent();
  }
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

function send_message(msg, timestamp) {
  socket.emit('chat message', {
    message: msg,
    room: chat.roomId,
    timestamp: timestamp,
    role: 'user'
  });
  //since we must be looking at messages we send, send RR
  readMostRecent();
}

function user_connect() {
  socket.emit('user connect');
}



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

var readToTimestamp = new Date(0);
function sendReadReceipt(timestamp) {
  if(timestamp > readToTimestamp) {
    socket.emit('read to timestamp', {
      room: chat.roomId,
      ts: timestamp.valueOf()
    });
    readToTimestamp = timestamp;
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
  let open = document.getElementById('open');
  open.innerHTML = '';
  open.innerHTML = '<div class=\'container-fluid text-center\'>Waiting to connect to an Ear!</div><div class=\'row\'><div class=\'loader\' id=\'load\'></div></div>' +
                   '<div class=\'container-fluid text-center\' style="margin-top: 16px"><div style="font-size: 16px">If this is taking too long to load, try calling Ears 4 Peers at (617) 627-3888.<br>Ears 4 Peers operates from 7pm - 7am. For more information, <a href="https://sites.tufts.edu/ears4peers/">click here</a>.</div></div>' + 
                   '<div class=\'container-fluid text-center\' style="margin-top: 16px"><div style="font-size: 16px">Feel free to call and hang up after a few rings to get our attention.</div></div>' +
                   '<div class=\'container-fluid text-center\' style="margin-top: 16px"><div style="font-size: 16px">If this is an emergency, please call TUPD at (617) 627 3030 and ask to speak with the counselor on call.</div></div>';
  console.log('attempting to connect');
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
  $('#e_space').css('height', '4.3rem');
  $('#chat').attr('style', 'display: flex !important');
  chatbox = document.getElementById('chatbox');
  chatbox.style.display = 'block';

  chatbar = document.getElementById('chatbar');
  chatbar.style.visibility= 'visible';
  chat.accepted = true;

  $('#typingIcon').before(createStatusDiv('An Ear has accepted your conversation.'));
  $('#typingIcon').before(createStatusDiv('Talk to us about anything that\'s on your mind.'));
  $('#typingIcon').before(createStatusDiv('Keep this window open to receive notifications!'));
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
  const newMessage = createMessageDiv(messageSide, escapeMessage(messageObj.message), messageObj.timestamp);
  $('#typingIcon').before(newMessage);
  scrollDown();
}


function createMessage(role, messageString, timestamp) {
  return {
    role: role,
    message: messageString,
    timestamp: (timestamp || new Date())
  };
}

function sendMessage() {
  let message = $('#inputBox').val();
  if (message != '') {
    let messageObject = createMessage('user', message);
    chat.messages.push(messageObject);
    updateChat(messageObject);
    send_message(message, messageObject.timestamp);
    message = $('#inputBox').val('');
  }
}

function admin_matched() {
  startChat();
  console.log('admin matched');
}

// Sends a read reciept for the most recent message.
function readMostRecent() {
  let msgs = $('#chathistory .message-container');
  if (msgs) {
    sendReadReceipt(new Date(msgs.last().data('time')));
  }
}

// Checks if bottom of #chathistory (most recent message) is visible.
function isChatHistBottom() {
  let mbox = $('#chathistory');
  let isScrollable = mbox[0].scrollHeight > mbox[0].clientHeight;
  if(isScrollable) {
    let isBottom = mbox.prop('scrollHeight') - mbox.scrollTop() - mbox.outerHeight() < 1;
    return isBottom;
  } else {
    return true;
  }
}

$(() => {
  $('#type_msg').html(chatElements(''));
  // If we start looking at the window & are at the bottom, send RR.
  $(window).focus(() => {
    if(isChatHistBottom()) {
      readMostRecent();
    }
  });
  // If we scroll to see most recent message, send RR.
  $('#chathistory').scroll(() => {
    if (isChatHistBottom() && document.hasFocus()) {
      readMostRecent();
    }
  });
  chatSetup(sendMessage);
});

function deactivateChat() {
  chat.active = false;
}
