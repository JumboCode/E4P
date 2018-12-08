/*
 * Return a message div based on the role and message string.
 */
function createMessageDiv(side, message) {
    return "<div class= 'container'><div class='" + side + "-chat-bubble'> " + escapeMessage(message) + "</div></div>";
}

/*
 * Returns the formatted time stamp.
 */
function getTimeString(time) {
  return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

function escapeMessage(message) {
	// Escape "<"
	let lt_re = new RegExp("<", "g");
	message = message.replace(lt_re, "&lt");

	// Escape ">"
	let gt_re = new RegExp(">", "g");
	message = message.replace(gt_re, "&gt");

	return message
}

function chatElements() {
  return '<textarea id="messageBox" type="text" autocomplete="off" placeholder="Type a message..."></textarea>'
       + '<div id="sendButton" onclick="sendMessage()""><div id="sendButtonText">Send</div></div>';
}

function chatSetup(sendMessage) {
  $("#messageBox").keydown(function(e) {
    if (e.which == 13 && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}