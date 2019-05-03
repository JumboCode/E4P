window.onbeforeunload = () => {
  alert('Are you sure you want to leave? Your chat connections will be lost.');
};

// keep heroku instance alive every 20 minutes
setInterval(() => {
  let currentDate = new Date();
  let currentUTCTime = currentDate.getUTCHours();

  if (currentUTCTime >= 23 || currentUTCTime <= 11) {
    $.get('/keepalive');
  }

}, 1000 * 60 * 0.1);

const socket = io();

socket.on('connect', () => {
  // Register as Admin
  $.post('/admin', { admin: socket.id }, (conversations) => {
    if (conversations.constructor !== Array) {
      window.location.replace(window.location.href + '/login');
      return;
    }
    for (let conversation of conversations) {
      // Show non-active, unaccepted chats
      if (!conversation.active) {
        newChat(conversation.room, conversation.icon, conversation.readTo);
        for (let message of conversation.messages) {
          addMessage(conversation.room, createMessage(message.role, message.message, new Date(message.timestamp)));
        }
        reactivateChat(conversation.room);
      }

      if (!conversation.connected) {
        pauseChat(conversation.room);
        addMessage(conversation.room, createMessage('status', 'The user has disconnected. You can still send messages, but the user won\'t see them unless the user returns.'));
      }
    }
    socket.emit('sound on');
    updateUserOverview();
  });
});

socket.on('user matched', user_matched);

socket.on('sound on', () => {
  console.log('sound on');
});

socket.on('chat message', (data) => {
  addMessage(data.room, createMessage('user', data.message, new Date(data.timestamp)));
  messageSound();
  // Chat message received, so user is not typing anymore
  userNotTyping(data.room);
});

// removes a user from the waiting list
function user_matched(user) {
  console.log('user matched ' + user);

  // remove user from chat list if it exists
  for (let messageStream of chats) {
    if (messageStream.userId == user) {
      removeChat(user);
      break;
    }
  }
}

socket.on('user unmatched', (conversation) => {
  newChat(conversation.user, conversation.icon);
  for (let message of conversation.messages) {
    addMessage(conversation.room, createMessage(message.role, message.message, new Date(message.timestamp)));
  }
  addMessage(conversation.user, createMessage('status', 'This user was disconnected from a previous Ear.'));
  updateUserOverview();
});

socket.on('user disconnect', (userId) => {
  console.log('user disconnected ' + userId);
  addMessage(userId, createMessage('status', 'The user has disconnected. You can still send messages, but the user won\'t see them unless the user returns.'));
  pauseChat(userId);
  if (userId == CURRENT_CHAT_USER_ID) {
    toggleChat(CURRENT_CHAT_USER_ID);
  }
});

socket.on('user gone for good', (userId) => {
  console.log('user chat being deleted ' + userId);
  addMessage(userId, createMessage('status', 'The user did not reconnect in time.'));
  deactivateChat(userId);
  if (userId == CURRENT_CHAT_USER_ID) {
    toggleChat(CURRENT_CHAT_USER_ID);
  }
});

socket.on('user reconnect', (userId) => {
  // TODO: display a message saying the user reconnected
  console.log('user reconnected ' + userId);
  addMessage(userId, createMessage('status', 'The user has reconnected.'));
  reactivateChat(userId);
  toggleChat(CURRENT_CHAT_USER_ID);
});

socket.on('user waiting', user_waiting);

function user_waiting(user, icon) {
  console.log('user waiting ' + user);
  console.log('creating new chat for user waiting');
  newChatWithAlert(user, icon);
  updateUserOverview();
}

socket.on('typing', user_typing);

function user_typing(data) {
  userIsTyping(data.room);
}

socket.on('stop typing', user_stop_typing);

function user_stop_typing(data) {
  userNotTyping(data.room);
}

socket.on('read to timestamp', (data) => {
  for (let chat of chats) {
    if (chat.userId === data.room) {
      chat.readTo = new Date(data.ts);
    }
  }
  if (data.room === CURRENT_CHAT_USER_ID) {
    updateReadReceipt();
  }
});

// RECEIVE ^^^
///////////////////////////////////////
// SEND    vvv

function send_message(user, msg, timestamp) {
  socket.emit('chat message', {
    message: msg,
    timestamp: timestamp,
    room: user,
    role: 'admin'
  });
}

// accepts a waiting user
function accept_user(user) {
  socket.emit('accept user', user);
}

function send_typing_message(user_id, is_typing) {
  if (is_typing == true) {
    socket.emit('typing', {
      room: CURRENT_CHAT_USER_ID
    });
  } else {
    socket.emit('stop typing', {
      room: CURRENT_CHAT_USER_ID
    });
  }
}

let chats = [];
let CURRENT_CHAT_USER_ID = '';
const ICON_SRC = 'img/Animal Icons Small.png';

/**************************** INITIALIZE ****************************/

function initialize() {
  // Can be used for testing:
  // mockChats();
  // populateChat();
  updateUserOverview();
  generateAdminHeader();
  newChatSoundLoop();
  connectionListeners();
}

function connectionListeners() {
  window.addEventListener('online', userOnline);
  window.addEventListener('offline', userOffline);
}

function userOnline() {
  $('.connectionIndicator')
    .html('<p class="connection-online">Connected</p>')
    .show().delay(5000).slideUp(100);
}

function userOffline() {
  $('.connectionIndicator')
    .html('<p class="connection-offline">No Internet Connection</p>')
    .show();
}

/**************************** FUNCTIONS FOR DISPLAY UPDATES ****************************/

function getIconTagAndText(icon) {
  let iconTag = '';
  let iconText = '';

  if (isNaN(parseInt(icon))) {
    iconTag = `<img class='icon' src='img/icons/${icon}.png'>`;
    iconText = icon.charAt(0).toUpperCase() + icon.slice(1);
  } else {
    iconTag = `<div class='icon'>${icon}</div>`;
    iconText = `User ${icon}`;
  }

  return {
    iconTag: iconTag,
    iconText: iconText
  };
}


// updates the left chat menu to catch newly added users
function updateUserOverview() {
  let tab = document.getElementsByClassName('tab')[0];
  if (typeof tab !== 'undefined') {
    tab.innerHTML = '';
  }
  for (let chat of chats) {
    let selectedChat = chat.userId == CURRENT_CHAT_USER_ID ? 'id="selectedTab"' : '';

    let temp = getIconTagAndText(chat.icon);
    let iconTag = temp.iconTag;
    let iconText = temp.iconText;

    let messagePreview = chat.messages.length == 0 ? '' : chat.messages[chat.messages.length - 1].message;
    messagePreview = messagePreview.split('<br/>').join(' ');
    let typing = chat.typing ? ' id=typing' : '';
    let alert = chat.alert ? ' id=alert' : '';
    tab.innerHTML = tab.innerHTML
                  + "<button class='btn btn-light' " + selectedChat
                  + " onclick='toggleChat(`" + chat.userId + "`)'>"
                    + "<div class='iconParent'" + alert + ">" + iconTag + "</div>"
                    + "<div class='notIcon'>"
                      + "<div class='buttonText'" + alert + ">" 
                          + "<div class='buttonId'>" + iconText + "</div>"
                          + "<div class='messagePreview'>" + messagePreview + "</div>"
                      + "</div>"
                      + "<div class='buttonTypingDiv'" + typing + ">"
                          + "<img class='buttonTypingIcon' src='img/typing_icon.png'>"
                      + "</div>"
                      + "<div class='alertBar'" + alert + "></div>"
                    + "</div>"
                  + "</button>";
  }
}

function clearView() {
    $('#chatHeader-icon').empty();
    $('#chatHeader-pseudonym').empty();
    $('.chatAction').html("");
    $('.messages').html("");
}

function appendMessageToDiv(message, div) {
  let toAppend = '';
  if (message.role == 'status') {
    toAppend = createStatusDiv(message.message);
  } else if (message.role == 'admin') {
    toAppend = createMessageDiv('right', message.message, message.timestamp);
  } else {
    toAppend = createMessageDiv('left', message.message, message.timestamp);
  }

  div.append(toAppend);
}

function updateReadReceipt() {
  $('#readReceipt').remove();
  //find most recent message with timestamp <= ts and push read receipt as last child
  let currChat = chats.find((cht) => cht.userId === CURRENT_CHAT_USER_ID);
  let leTs = $('.message-container').filter((i, e) => {
    return (new Date(Number(e.dataset.time))) <= currChat.readTo;
  }
  ).last();
  if (leTs.length) {
    leTs.after(`<div class='${leTs[0].dataset.side}-readReceipt' id='readReceipt'>Read</div>`);
  }
}

function toggleChat(userId) {
  //Update global 'current chat' state.
  updateCurrentInput(CURRENT_CHAT_USER_ID);
  CURRENT_CHAT_USER_ID = userId;
  //Get the index of the selected chat.
  let tabId = chats.findIndex((cht) => cht.userId === userId);
  if (tabId !== -1) {
    //Get the current chat object.
    let chat = chats[tabId];
    //Set chat header.
    let temp = getIconTagAndText(chat.icon);
    $('#chatHeader-icon').html(temp.iconTag);
    $('#chatHeader-pseudonym').text(temp.iconText);
    //Rehydrate message info.
    let currentChat = $('.messages').first();
    currentChat.html('');
    chat.messages.forEach((msg) => {appendMessageToDiv(msg, currentChat)});
    //Set typing indicator.
    $('#typingIcon').css('display', (chat.typing ? 'block' : 'none'));
    //Update available actions.
    let actionDiv = $('.chatAction').first();
    if (!chat.accepted) {
      actionDiv.html('<button id=\'accept\' class=\'btn btn-light\' onclick=\'acceptChat(CURRENT_CHAT_USER_ID)\'>Accept Chat</button>');
    } else if (chat.active) {
      actionDiv.html(chatElements(chat.currentMessage));
      chatSetup(sendMessage);
      scrollDown();
    } else if (chat.reconnecting) {
      actionDiv.html(chatElements(chat.currentMessage) + '<button id=\'delete\' class=\'btn btn-light\' onclick=\'removeChatRemotely(CURRENT_CHAT_USER_ID)\'>Delete Chat Permanently</button>');
      chatSetup(sendMessage);
      scrollDown();
    } else {
      actionDiv.html('<button id=\'delete\' class=\'btn btn-light\' onclick=\'removeChat(CURRENT_CHAT_USER_ID)\'>Delete Chat</button>');
    }
    
  }
  updateReadReceipt();
  scrollDown();
  updateUserOverview();
}

function scrollDown() {
  let mbox = $('.messagesBox').first();
  mbox.scrollTop(mbox.prop('scrollHeight') - mbox.prop('clientHeight'));
}

function updateCurrentInput(userId) {
  for (chat of chats) {
    if (chat.userId == userId && chat.accepted) {
      currentMessage = $('#inputBox').val();
      chat.currentMessage = currentMessage;
    }
  }
}

/**************************** SINGLE CHAT FUNCTIONS ****************************/

/*
    Given a user identifier, creates a new chat for that user if the identifier is unique
    and logs an error if it is a duplicate
*/
function newChat(userId, icon, readTo) {
  let validUser = true;
  for (let chat of chats) {
    if (userId == chat.userId) {
      console.log(Error('Cannot have multiple chats with identical user identifiers'));
      validUser = false;
    }
  }
  if (validUser) {
    chats.unshift({
      userId: userId,
      messages: [],
      accepted: false,
      active: true,
      typing: false,
      readTo: new Date(readTo || 0),
      icon: icon,
      alert: true,
      reconnecting: false,
      currentMessage: ''
    });
  }
}

function reactivateChat(userId) {
  let foundUser = false;
  for (let chat of chats) {
    if (userId == chat.userId) {
      chat.active = true;
      chat.typing = false;
      chat.alert = true;
      chat.reconnecting = false;
      foundUser = true;
      updateUserOverview();
    }
  }
  if (!foundUser) {
    console.log(Error('User with given identifier could not be found'));
  }
}

function pauseChat(userId) {
  let foundUser = false;
  for (let chat of chats) {
    if (userId == chat.userId) {
      chat.active = false;
      chat.typing = false;
      chat.alert = true;
      chat.reconnecting = true;
      foundUser = true;
      updateUserOverview();
    }
  }
  if (!foundUser) {
    console.log(Error('User with given identifier could not be found'));
  }
}

function newChatWithAlert(userId, icon) {
  newChat(userId, icon);
  chatSound();
}

function deactivateChat(userId) {
    foundUser = false;
    for (chat of chats) {
        if (userId == chat.userId) {
            chat.active = false;
            chat.typing = false;
            chat.alert = true;
            chat.reconnecting = false;
            foundUser = true;
            updateUserOverview();
        }
    }
    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
    }
} 

function acceptChat(userId) {
  acceptChatUI(userId);
  accept_user(userId);
}

function acceptChatUI(userId) {
  foundUser = false;
  for (chat of chats) {
      if (userId == chat.userId) {
          chat.accepted = true;
          chat.alert = false;
          foundUser = true;
      }
  }
  if (!foundUser) {
      console.log(Error('User with given identifier could not be found'));
  }
  toggleChat(userId);
}

function removeChat(userId) {
    console.log('remove chat with ' + userId);
    foundUser = false;
    newChats = [];
    for (chat of chats) {
        if (userId == chat.userId) {
            chat.active = false;
            foundUser = true;
        } else {
            newChats.push(chat);
        }
    }
    chats = newChats;
    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
    }
    updateUserOverview();
    clearView();
    if (chats.length > 0) {
        toggleChat(chats[0].userId)
    }
}

function removeChatRemotely(userId) {
  if (confirm('Are you sure you want to delete this chat permanently?')) {
    $.post('/admin/removeConversation', { userId: userId }, (state) => {
      console.log(state);
    });
    removeChat(userId);
  }
}

function userIsTyping(userId) {
  for (let chat of chats) {
    if (userId == chat.userId) {
      if (chat.typing == false) {
        chat.typing = true;
        updateUserOverview();
      }
    }
  }
  if (userId == CURRENT_CHAT_USER_ID) {
    showCurrentTyping(true);
    scrollDown();
  }
}

function userNotTyping(userId) {
  for (let chat of chats) {
    if (userId == chat.userId) {
      if (chat.typing == true) {
        chat.typing = false;
        updateUserOverview();
      }
    }
  }
  if (userId == CURRENT_CHAT_USER_ID) {
    showCurrentTyping(false);
  }
}

function showCurrentTyping(userIsTyping) {
  currentUserTyping = userIsTyping ? 'block' : 'none';
  $('#typingIcon').css('display', currentUserTyping);
}


/**************************** SINGLE MESSAGE FUNCTIONS ****************************/


/*
    To create a message object, we use the function createMessage. Given a role and a message string,
    this function appends creates a new messageObject that can be sent to addMessage.
*/
function createMessage(role, messageString, timestamp) {
  return {
    role: role,
    message: escapeMessage(messageString),
    timestamp: (timestamp || new Date())
  };
}

function sendMessage() {
  let message = $('#inputBox').val();
  if (message != '') {
    console.log('sending message');
    message = $('#inputBox').val();
    send_message(CURRENT_CHAT_USER_ID, message, new Date());
    let messageObject = createMessage('admin', message);
    addMessage(CURRENT_CHAT_USER_ID, messageObject);
    message = $('#inputBox').val('');
  }
}

/*
    Given a user identifier and a messageObject, appends the message object to that user's
    chat if it exists, logs an error if that user chat doesn't exist
*/
function addMessage(userId, messageObject) {
    let foundUser = false;
    for (let chat of chats) {
        if (userId == chat.userId) {
            chat.messages.push(messageObject);
            messageObject.role == 'admin' ? chat.alert = false : chat.alert = true;
            foundUser = true;
            if (userId == CURRENT_CHAT_USER_ID) {
                let currentChat = $('.messages').first();
                appendMessageToDiv(messageObject, currentChat);
            }
        }
        scrollDown();
    }

    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
    }
    updateUserOverview();
}



/**************************** TESTING FUNCTIONS ****************************/

function mockChats() {

    newChat('user1');
    newChat('user2');
    newChat('user3');
    newChat('this_is_a_really_long_username')

    message = createMessage('user', 'hi');
    addMessage('user1', message);
    addMessage('user2', message);
    addMessage('user3', message);

    message = createMessage('admin', 'hi user1');
    addMessage('user1', message);

    message = createMessage('admin', 'hi user2');
    addMessage('user2', message);
    message = createMessage('user', 'blah blah');
    addMessage('user2', message);

    message = createMessage('admin', 'hi user3');
    addMessage('user3', message);

    // acceptChat('user2');
    // acceptChat('user3');
    deactivateChat('user3');
}

function populateChat() {
    for (i = 0; i < 10; i++) {
        message = createMessage('user', 'short test');
        addMessage('user1', message);
        message = createMessage('admin', 'short test');
        addMessage('user1', message);
    }
    for (i = 0; i < 10; i++) {
        message = createMessage('user', 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test ');
        addMessage('user1', message);
        message = createMessage('admin', 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test '
            + 'this is a long test ');
        addMessage('user1', message);
    }

}
