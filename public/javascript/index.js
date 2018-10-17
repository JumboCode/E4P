chat = {};

/*
function startChat() {
	console.log("hello");
	openChat();
	newChat('user1');

	while (isOpen()) {

		newMessage = getMessage();
		addMessage(newMessage);
	}


}
*/


function getMessage() {

	var messageString = document.getElementById("messageString");
	console.log("Got a message!")
	return createMessage('user', messageString);

}

function openChat() {
	console.log("Opening");
	document.getElementById("myChat").style.display = "block";
}

function isOpen() {
	var active = document.getElementById("myChat").style.display;
	console.log(active);
	if (active == "block") {
		console.log("Open");
		return true;
	}
	console.log("Close");
	return false;
}

function closeChat() {

	document.getElementById("myChat").style.display = "none";

}

function newChat(userId) {

	console.log("New chat with a user");
	chat.messages = [];
	chat.userId = userId;
	chat.accepted = true;
	chat.active = true;


}

function createMessage(role, messageString) {
    return { role: role, message: messageString, timestamp: new Date() };
}

function addMessage(messageObject) {

	chat.messages.push(messageObject);
}

/*function mockChat() {

   	newChat('user1');

    message1 = createMessage('user', 'hi');
    addMessage(message1);

    message2 = createMessage('admin', 'hi user1');
    addMessage(message2);

    console.log(chat.messages);
}
*/