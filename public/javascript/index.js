var chat = {
	userId: 'user1',
	messages: [],
	accepted: true,
	active: false
	};


function openChat() {
	document.getElementById("chatbox").style.display = "block";
	document.getElementById("chat-start").style.display = "none";
}

function getMessage() {

	var message = document.getElementById("message").value;
	var messageObj = createMessage('user', message);
	chat.messages.push(messageObj);
	document.getElementById("message").value="";
	updateChat(messageObj);
}


function updateChat(messageObj) {
		messages = document.getElementsByClassName("chatlogs")[0];
		messages.innerHTML = messages.innerHTML + "<div class='chat "+messageObj.role+"'><div class='chat-message'><p>"+messageObj.message+"</p></div></div>";

}


function createMessage(role, messageString) {
    return { role: role, message: messageString, timestamp: new Date() };
}

/* function to change accepted from true to false when admin accepts chat */
/* function to change active to false when user exits out */
