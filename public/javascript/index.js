const socket = io();

$(document).ready(() => {
  const availableUI = `
      <div class='row'>Ears for Peers</div>
      <img src='img/baby_elephant.png'>
      <div class='row'>
        <button type='button' onclick='openChat()'>Connect Me to an Ear</button>
      </div>
      <p style="font-size: 16px">To reach out to Ears for Peers, see their <a href="http://sites.tufts.edu/ears4peers/contact-us">Contact Us Page</a>.</p>
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
  console.log('connected to socket');
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
  let openPanel = document.getElementById('open');
  openPanel.innerHTML = '';
  openPanel.innerHTML = ' <div class=\'row\'>Waiting to connect to an ear!</div><div class=\'row\'><div class=\'loader\' id=\'load\'></div></div>';
  console.log('attempting to connect');
  window.onbeforeunload = () => {
    return 'Are you sure you want to leave? Your chat connection will be lost.';
  };

  user_connect();
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
}


function getMessage() {
  sendMessage();
  window.onbeforeunload = warning;
}


function updateChat(messageObj) {
  let messages = document.getElementById('chathistory');
  const messageSide = (messageObj.role == 'admin' ? 'left' : 'right');
  const newMessage = createMessageDiv(messageSide, messageObj.message);
  $('#typingIcon').before(newMessage);
  messages.scrollTop = messages.scrollHeight - messages.clientHeight;
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
