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

    exampleChatUsage();
}


function exampleChatUsage() {

    // Creates new chat with a user called 'chat1'
    newChat('chat1');
    console.log(chats);

    // Example of creating a new chat with a duplicate user name
    // will result in an error
    newChat('chat1');

    // Adds a message saying 'hello' from the 'chat1' user to the chat 
    messageObject = { role: 'user', message: 'hello', timestamp: new Date()}
    addMessage('chat1', messageObject);
    console.log(chats);

    // Example of adding a message to a chat that does not exists
    // will also result in an error
    addMessage('chat2', messageObject);

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


// Given a user identifier, creates a new chat for that user if the identifier is unique
// and logs an error if it is a duplicate
function newChat(user) {
    validUser = true;
    for (chat of chats) {
        if (user == chat.user) {
            console.log(Error('Cannot have multiple chats with identical user identifiers'));
            validUser = false;
        }
    }
    if (validUser) {
        chats.push({ user: user, messageStream: { messages: [], active: true } });
    }
}

// Given a user identifier and a messageObject, appends the message object to that user's
// chat if it exists, logs an error if that user chat doesn't exist 
function addMessage(user, messageObject) {
    foundUser = false;
    for (chat of chats) {
        if (user == chat.user) {
            chat.messageStream.messages.push(messageObject);
            foundUser = true;
        }
    }
    if (!foundUser) {
        console.log(Error('User with given identifier could not be found'));
    }
}
