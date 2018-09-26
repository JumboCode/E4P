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

window.onload = initialize();