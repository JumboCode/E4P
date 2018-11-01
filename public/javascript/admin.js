const socket = io();

socket.on('user matched', user_matched);

socket.on('chat message', function(data) {
  console.log('recieved chat message on admin: ' + data);

  addMessage(data.id, createMessage('user', data.msg))
});

// removes a user from the waiting list
function user_matched(user) {
  console.log('user matched ' + user);
  // TODO - remove user from whatever list
}

socket.on('user disconnect', end_chat);

// ends a chat with given user
function end_chat(user) {
  console.log('user disconnected ' + user);
  // TODO - Frontend: close chat
}

socket.on('user waiting', user_waiting);

function user_waiting(user) {
  console.log('user waiting ' + user);
  console.log('creating new chat for user waiting');
  newChat(user);
  updateUserOverview();
}

// RECEIVE ^^^
///////////////////////////////////////
// SEND    vvv

function send_message(user, msg) {
  socket.emit('chat message', {
    message: msg,
    target: user
  });
}

// accepts a waiting user
function accept_user(user) {
  socket.emit('accept user', user);
}

chats = [];
CURRENT_CHAT_USER_ID = '';

function initialize() {
    // Can be used for testing:
    // mockChats();
    updateUserOverview();
}

// updates the left chat menu to catch newly added users
function updateUserOverview() {
    tab = document.getElementsByClassName("tab")[0];
    tab.innerHTML = '';

    for (chat of chats) {
        tab.innerHTML = tab.innerHTML + "<button class='username' onclick='toggleChat(`" + chat.userId+ "`)'>" + chat.userId + "</button>";
    }
    clearView();
}

function toggleChat(userId) {
    CURRENT_CHAT_USER_ID = userId
    for (chat of chats) {
        if (chat.userId == userId) {
            currentChat = document.getElementsByClassName("messages")[0];
            currentChat.innerHTML = "";
            for (message of chat.messages) {
                currentChat.innerHTML = currentChat.innerHTML + createMessageDiv(message.role, message.message)
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
}

/*
    Given a user identifier, creates a new chat for that user if the identifier is unique
    and logs an error if it is a duplicate
*/
function newChat(userId) {
    validUser = true;
    for (chat of chats) {
        if (userId == chat.userId) {
            console.log(Error('Cannot have multiple chats with identical user identifiers'));
            validUser = false;
        }
    }
    if (validUser) {
        chats.push({ userId: userId, messages: [], accepted: false, active: true });
    }
}

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
              currentChat.innerHTML = currentChat.innerHTML + createMessageDiv(messageObject.role, messageObject.message);
            }
        }
    }
    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
    }
}

/*
 * Return a message div based on the role and message string.
 */
function createMessageDiv(role, message) {
    return "<div class= 'container'><div class='" + role + "'> " + message + "</div></div>";
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
}

function clearView() {
    $('.chatAction').html("");
    $('.messages').html("");

}

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
