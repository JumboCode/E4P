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











/* function newChat() {
	
	openChat();
	chat.active = isOpen();
	while(getMessage()) {
		
		startChatting();
	}
}


function startChatting() {
	
	//for(chat.messages of chat) {
		//console.log(chat.message.length);
		for(messages of chat) {
			multMess = document.getElementById("message-container").innerHTML;
			mullMess.innerHTML += "<p> " + document.getElementById("message-container").innerHTML + "</p>";
		}
		closeChat();
		//document.getElementById("messageString") = chat.messages[0];
	//document.getElementById("messageString") = "Hi User";
}

// creates a messageObject from a string and role
function createMessage(role, messageString) {
    return { role: role, message: messageString, timestamp: new Date() };
}

// Adds the message to the messageStream
function addMessage(messageObject) {

		console.log(chat.messages[0].toString());
		chat.messages.push(messageObject);

}

// Gets the string from the form and creates a messageObject
// for a user with the string
function getMessage() {

	var messageString = document.getElementById("messageString");
	console.log("Got a message!");
	var newObj = createMessage('user', messageString);
	chat.messages.push(newObj);
	console.log(chat.messages.length);
	if (isOpen()) {
		return true;
	}
	return false;
}

// Opens the chatbox to start typing when you press chat
function openChat() {
	console.log("Opening");
	document.getElementByClass("chatbox").style.display = "block";
}

function isOpen() {
	var active = document.getElementById("myChat").style.display;
	console.log(active);
	if (active == "block") {
		console.log("Open");
		return true;
	}
	return false;
}

function closeChat() {


}

function closeChatBox() {
	chat.active = false;
	document.getElementByClass("chatbox").style.display = "none";

}*/
