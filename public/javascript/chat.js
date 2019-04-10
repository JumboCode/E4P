/*
 * Return a message div based on the role and message string and timestamp.
 */
function createMessageDiv(side, message, timestamp) {
  return '<div class= \'message-container\'><div class=\'' + side + '-chat-bubble\'> '
    +  message + ' </div><div class= \'' + side + '-time\'> '
    + getTimeString(timestamp) + ' </div></div>';
}

const createStatusDiv = (message) => `
  <div class='status-container'>${message}</div>
`;

/*
 * Returns the formatted time stamp.
 */
function getTimeString(time) {
  return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

function escapeMessage(message) {
  // Escape "<"
  let lt_re = new RegExp('<', 'g');
  message = message.replace(lt_re, '&lt');

  // Escape ">"
  let gt_re = new RegExp('>', 'g');
  message = message.replace(gt_re, '&gt');

  // Escape "\n"
  let newline_re = new RegExp('\n', 'g');
  message = message.replace(newline_re, '<br/>');
  
  return message;
}

function chatElements(currentMessage) {
  currentText = currentMessage ? currentMessage : '';
  return '<textarea id="inputBox" type="text" autocomplete="off" placeholder="Type a message...">'
       + currentText + '</textarea>'
       + '<div id="sendButton"><div id="sendButtonText">Send</div></div>';
}

let lastTypingMessage = new Date();

function chatSetup(sendMessage) {
  $('#inputBox').keydown((e) => {
    let currentTime = new Date();
    if (currentTime - lastTypingMessage > 3000) {
      lastTypingMessage = currentTime;

      // Check if on user side
      if (typeof(CURRENT_CHAT_USER_ID) == 'undefined' && typeof(chat.roomId) != 'undefined') {
        send_typing_message(true);
        // clear timout that would send message "stop typing" message
        if (typeof(userTypingTimeout) != 'undefined') {
          clearTimeout(userTypingTimeout);
        }

        userTypingTimeout = setTimeout(() => {
          send_typing_message(false);
        }, 5000);
      } else {
        send_typing_message(CURRENT_CHAT_USER_ID, true);
        if (typeof(adminTypingTimeout) != 'undefined') {
          clearTimeout(adminTypingTimeout);
        }
        adminTypingTimeout = setTimeout(() => {
          send_typing_message(CURRENT_CHAT_USER_ID, false);
        }, 5000);
      }
    }

    // Send text message after userTyping message
    if (e.which == 13 && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      let currentTime = new Date();
      lastTypingMessage = currentTime;
    }
  });

  $('#sendButton').click((e) => {
    sendMessage();
    let currentTime = new Date();
    lastTypingMessage = currentTime;
  });
}
