chats = [];

function initialize() {

    mockChats();

    for (chat of chats) {
        tab = document.getElementsByClassName("tab")[0];
        tab.innerHTML = tab.innerHTML + "<button class='username' onclick='toggleChat(`" + chat.userId+ "`)'>" + chat.userId + "</button>";
    }
}

function toggleChat(userId) {
    for (chat of chats) {
        if (chat.userId == userId) {
            currentChat = document.getElementsByClassName("messages")[0];
            currentChat.innerHTML = "";
            for (message of chat.messages) {
                currentChat.innerHTML = currentChat.innerHTML + "<p>" + message.role + ": " + message.message + "</p>";
            }
            actionDiv = document.getElementsByClassName("chatAction")[0];
            if (chat.active) {
                actionDiv.innerHTML = "<form action='sendMessage()'>"
                                    + "<input id='messageBox' type='text' name='messageInput' placeholder='Message'>"
                                    + "<input id='sendButton' type='submit' value='Send'>"
                                    + "</form>";
            } else {
                actionDiv.innerHTML = "<button id='delete'>Delete Thread</button>";
            }
        }
    }
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
        }
    }
    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
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

    deactivateChat('user3');

}
