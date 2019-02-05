const socket = io();

window.onload = () => {
  updateUserOverview();
  generateAdminHeader();
};

window.onbeforeunload = () => {
   return('Are you sure you want to leave? Your chat connections will be lost.');
};

socket.on('connect', () => {
  $.post("/admin", { admin: socket.id });
});

socket.on('user matched', (user) => {
  console.log('user matched ' + user);
  for (let messageStream of chats) {
    if (messageStream.userId == user) {
        removeChat(user);
        break;
    }
  }
});

socket.on('chat message', (data) => {
  addMessage(data.room, createMessage('user', data.message));
  userNotTyping(data.room);
});

socket.on('user disconnect', (user) => {
  console.log('user disconnected ' + user);
  deactivateChat(user);
  toggleChat(CURRENT_CHAT_USER_ID);
});

socket.on('user waiting', (user, icon) => {
  console.log('user waiting ' + user);
  console.log('creating new chat for user waiting');
  newChat(user, icon);
  updateUserOverview();
});

socket.on('typing', (data) => {
  userIsTyping(data.room);
});

socket.on('stop typing', (data) => {
  userNotTyping(data.room);
});

// RECEIVE ^^^
///////////////////////////////////////
// SEND    vvv

function send_message(user, msg) {
  socket.emit('chat message', {
    message: msg,
    room: user
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


chats = [];
CURRENT_CHAT_USER_ID = '';
const ICON_SRC = "img/Animal Icons Small.png";

/**************************** FUNCTIONS FOR DISPLAY UPDATES ****************************/


// updates the left chat menu to catch newly added users
function updateUserOverview() {
    let tab = $('.tab').first();
    tab.empty();

    for (let chat of chats) {
        let selectedChat = chat.userId == CURRENT_CHAT_USER_ID ? 'selectedTab' : '';
        let iconTag = (isNaN(parseInt(chat.icon))) ?
          `<img class='icon' src='${ICON_SRC}' id='${chat.icon}'>` :
          `<div class='icon'>${chat.icon}</div>`;
        let iconText = chat.icon.charAt(0).toUpperCase() + chat.icon.slice(1);
        let messagePreview = chat.messages.length == 0 ? '' : chat.messages[chat.messages.length - 1].message;
        let typing = chat.typing ? ' id=typing' : '';
        let alert = chat.alert ? ' id=alert' : '';
        tab.html(`
          <button class='username tabToggleChat' id='${selectedChat}'>
            ${iconTag}
            <div class='buttonText'>
              <div class='buttonId'>${iconText}</div>
              <div class='messagePreview'>${messagePreview}</div>
            </div>
            <div class='buttonTypingDiv' id='${chat.typing ? 'typing' : ''}'>
              <img class='buttonTypingIcon' src='img/typing_icon.png'>
            </div>
            <div class='alertBar' id='${chat.alert ? 'alert' : ''}'></div>
          </button>
        `);
        tab.children('.tabToggleChat').click(() => {toggleChat(chat.userId);});
    }
}

function toggleChat(userId) {
    updateCurrentInput(CURRENT_CHAT_USER_ID);
    CURRENT_CHAT_USER_ID = userId;
    let tabId = 0;
    for (let chat of chats) {
        if (chat.userId == userId) {
            let currentChat = $('.messages').first();
            currentChat.empty();
            for (let message of chat.messages) {
                let messageSide = message.role == 'admin' ? 'right' : 'left';
                currentChat.append(createMessageDiv(messageSide, message.message));
            }
            let currentUserTyping = chat.typing ? 'block' : 'none';
            $('#typingIcon').css('display', currentUserTyping);
            let actionDiv = $('.chatAction').first();
            if (!chat.accepted) {
              actionDiv.html(`<button id='accept'>Accept Thread</button>`);
              actionDiv.children('#accept').click(() => {acceptChat(CURRENT_CHAT_USER_ID);});
            }
            else if (chat.active) {
              actionDiv.html(chatElements(chat.currentMessage));
              chatSetup(sendMessage);
              scrollDown();
            } else {
              actionDiv.html(`<button id='delete'>Delete Thread</button>`);
              actionDiv.children('#delete').click(() => {removeChat(CURRENT_CHAT_USER_ID);});
            }
        }
        tabId++;
    }
  scrollDown();
  updateUserOverview();
}

function scrollDown() {
  let messagesBox = $('.messagesBox').first();
  messagesBox.scrollTop(messagesBox.prop('scrollHeight'));
}

function updateCurrentInput(userId) {
    for (let chat of chats) {
        if (chat.userId == userId && chat.accepted && chat.active) {
            let currentMessage = $('#inputBox').val();
            chat.currentMessage = currentMessage;
        }
    }
}

/**************************** SINGLE CHAT FUNCTIONS ****************************/

/*
    Given a user identifier, creates a new chat for that user if the identifier is unique
    and logs an error if it is a duplicate
*/
function newChat(userId, icon) {
    console.log("new chat");
    let validUser = true;
    for (let chat of chats) {
        if (userId == chat.userId) {
            console.log(Error('Cannot have multiple chats with identical user identifiers'));
            validUser = false;
        }
    }
    if (validUser) {
        chats.push(
            { userId: userId,
              messages: [],
              accepted: false,
              active: true,
              typing: false,
              icon: icon,
              alert: true,
              currentMessage: "" }
        );
    }
}


function deactivateChat(userId) {
    let foundUser = false;
    for (let chat of chats) {
        if (userId == chat.userId) {
            chat.active = false;
            chat.typing = false;
            chat.alert = true;
            foundUser = true;
            updateUserOverview();
        }
    }
    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
    }
}

function acceptChat(userId) {
    let foundUser = false;
    for (let chat of chats) {
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
    accept_user(userId);
}

function removeChat(userId) {
    console.log('remove chat with ' + userId);
    let foundUser = false;
    let newChats = [];
    for (let chat of chats) {
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
    //Clear view
    $('.chatAction, .messages').empty();
    if (chats.length > 0) {
        toggleChat(chats[0].userId)
    }
}

function userIsTyping(userId) {
    for (let chat of chats) {
        if (userId == chat.userId) {
            chat.typing = true;
        }
    }
    updateUserOverview();
    if (userId == CURRENT_CHAT_USER_ID) {
        showCurrentTyping(true);
    }

}

function userNotTyping(userId) {
    for (let chat of chats) {
        if (userId == chat.userId) {
            chat.typing = false;
        }
    }
    updateUserOverview();
    if (userId == CURRENT_CHAT_USER_ID) {
        showCurrentTyping(false);
    }

}

function showCurrentTyping(userIsTyping) {
    let currentUserTyping = userIsTyping ? 'block' : 'none';
    $('#typingIcon').css('display', currentUserTyping);
}


/**************************** SINGLE MESSAGE FUNCTIONS ****************************/


/*
    To create a message object, we use the function createMessage. Given a role and a message string,
    this function appends creates a new messageObject that can be sent to addMessage.
*/
function createMessage(role, messageString) {
    return { role: role, message: messageString, timestamp: new Date() };
}

function sendMessage() {
    let message = $('#inputBox').val();
    if (message != '') {
        console.log("sending message");
        message = $('#inputBox').val();
        send_message(CURRENT_CHAT_USER_ID, message);
        messageObject = createMessage("admin", message);
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
            chat.alert = true;
            foundUser = true;
            if (userId == CURRENT_CHAT_USER_ID) {
                let messageSide = 'left';
                if (messageObject.role == 'admin') {
                    chat.alert = false;
                    messageSide = 'right';
                }
                $("#typingIcon").before(createMessageDiv(messageSide, messageObject.message));
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
