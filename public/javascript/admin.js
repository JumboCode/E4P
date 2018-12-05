const socket = io();

socket.on('connect', () => {
  // send as POST request
  $.post("/admin", { admin: socket.id });
});

socket.on('user matched', user_matched);

socket.on('chat message', function(data) {
  console.log('recieved chat message on admin: ' + data);

  addMessage(data.room, createMessage('user', data.message))
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

socket.on('user disconnect', end_chat);

// ends a chat with given user
function end_chat(user) {
  console.log('user disconnected ' + user);
  deactivateChat(user);

  // reload the current window:
  toggleChat(CURRENT_CHAT_USER_ID);
}

socket.on('user waiting', user_waiting);

function user_waiting(user, icon) {
  console.log('user waiting ' + user);
  console.log('creating new chat for user waiting');
  newChat(user, icon);
  updateUserOverview();
}

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

chats = [];
CURRENT_CHAT_USER_ID = '';
const ICON_SRC = "img/Animal Icons Small.png";

/**************************** INITIALIZE ****************************/

function initialize() {
    // Can be used for testing:
    // mockChats();
    // populateChat();
  
    updateUserOverview();
    generateAdminHeader();
}

/**************************** FUNCTIONS FOR DISPLAY UPDATES ****************************/


// updates the left chat menu to catch newly added users
function updateUserOverview() {
    tab = document.getElementsByClassName("tab")[0];
    tab.innerHTML = '';

    for (chat of chats) {
        selectedChat = chat.userId == CURRENT_CHAT_USER_ID ? "id='selectedTab'" : "";
        tab.innerHTML = tab.innerHTML + "<button " + selectedChat + "onclick='toggleChat(`" + chat.userId+ "`)'><img class='icon' src='" + ICON_SRC + "' id='" + chat.icon + "'><div class='username'>" + chat.icon + "</div></button>";
    }
}

function clearView() {
    $('.chatAction').html("");
    $('.messages').html("");
}

function toggleChat(userId) {
    CURRENT_CHAT_USER_ID = userId
    for (chat of chats) {
        if (chat.userId == userId) {
            currentChat = document.getElementsByClassName("messages")[0];
            currentChat.innerHTML = "";
            for (message of chat.messages) {
                messageSide = message.role == 'admin' ? 'right' : 'left';
                currentChat.innerHTML = currentChat.innerHTML + createMessageDiv(messageSide, message.message)
            }
            actionDiv = document.getElementsByClassName("chatAction")[0];
            if (!chat.accepted) {
                actionDiv.innerHTML = "<button id='accept' onclick='acceptChat(CURRENT_CHAT_USER_ID)'>Accept Thread</button>"
            }
            else if (chat.active) {
                actionDiv.innerHTML = "<input id='messageBox' type='text' name='messageInput' placeholder='Message' autocomplete='off'>"
                                    + "<div id='sendButton' onclick='sendMessage()'><div id='sendButtonText'>Send</div></div>";
            } else {
                actionDiv.innerHTML = "<button id='delete' onclick='removeChat(CURRENT_CHAT_USER_ID)'>Delete Thread</button>";
            }
        }
    }
    $("#messageBox").on('keyup', function (e) {
        if (e.keyCode == 13) {
            sendMessage();
        }
    });
    updateUserOverview();
}


/**************************** SINGLE CHAT FUNCTIONS ****************************/

/*
    Given a user identifier, creates a new chat for that user if the identifier is unique
    and logs an error if it is a duplicate
*/
function newChat(userId, icon) {
    console.log("new chat");
    validUser = true;
    for (chat of chats) {
        if (userId == chat.userId) {
            console.log(Error('Cannot have multiple chats with identical user identifiers'));
            validUser = false;
        }
    }
    if (validUser) {
        chats.push({ userId: userId, messages: [], accepted: false, active: true , icon: icon});
    }
}


function deactivateChat(userId) {
    foundUser = false;
    for (chat of chats) {
        if (userId == chat.userId) {
            chat.active = false;
            foundUser = true;
        }
    }
    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
    }
}

function acceptChat(userId) {
    foundUser = false;
    for (chat of chats) {
        if (userId == chat.userId) {
            chat.accepted = true;
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


/**************************** SINGLE MESSAGE FUNCTIONS ****************************/


/*
    To create a message object, we use the function createMessage. Given a role and a message string, 
    this function appends creates a new messageObject that can be sent to addMessage.
*/
function createMessage(role, messageString) {
    return { role: role, message: messageString, timestamp: new Date() };
}

function sendMessage() {
    message = $('#messageBox').val();
    if (message != '') {
        console.log("sending message")
        message = $('#messageBox').val();
        send_message(CURRENT_CHAT_USER_ID, message);
        messageObject = createMessage("admin", message);

        addMessage(CURRENT_CHAT_USER_ID, messageObject);
                
        message = $('#messageBox').val('');
    }

}


/*
    Given a user identifier and a messageObject, appends the message object to that user's
    chat if it exists, logs an error if that user chat doesn't exist 
*/
function addMessage(userId, messageObject) {
    foundUser = false;
    for (chat of chats) {
        if (userId == chat.userId) {
            chat.messages.push(messageObject);
            foundUser = true;
            if (userId == CURRENT_CHAT_USER_ID) {
                currentChat = document.getElementsByClassName("messages")[0];
                messageSide = messageObject.role == 'admin' ? 'right' : 'left';
                currentChat.innerHTML = currentChat.innerHTML + createMessageDiv(messageSide, messageObject.message);
            }
        }
    }
    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
    }
}



/**************************** TESTING FUNCTIONS ****************************/

function mockChats() {

    newChat('user1');
    newChat('user2');
    newChat('user3');

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

    acceptChat('user2');
    acceptChat('user3');
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
