chats = [];

function initialize() {
    // Get all elements with class="chatcontent" and hide them
    chatcontent = document.getElementsByClassName("chatcontent");
    for (i = 0; i < chatcontent.length; i++) {
        chatcontent[i].style.display = "none";
    }

    // Get all elements with class="username" and remove the class "active"
    username = document.getElementsByClassName("username");
    for (i = 0; i < username.length; i++) {
        username[i].className = username[i].className.replace(" active", "");
    }
}

function toggleChat(evt, chatName) {
    // Declare all variables
    var i, chatcontent, username;

    // Get all elements with class="chatcontent" and hide them
    chatcontent = document.getElementsByClassName("chatcontent");
    for (i = 0; i < chatcontent.length; i++) {
        chatcontent[i].style.display = "none";
    }

    // Get all elements with class="username" and remove the class "active"
    username = document.getElementsByClassName("username");
    for (i = 0; i < username.length; i++) {
        username[i].className = username[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    var currentChat = document.getElementById(chatName);
    currentChat.style.display = "block";
    if (currentChat.classList.contains("active")) {
        evt.currentTarget.className -= " active";
    }

    else {
        evt.currentTarget.className += " active";
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
