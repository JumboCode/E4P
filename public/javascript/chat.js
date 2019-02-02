import $ from 'jquery';
/*eslint-disable-next-line*/
import {jsxElem} from './jsxElem';

/*
 * Return a message div based on the role and message string.
 */
export function createMessageDiv(side, message) {
  return (
    <div class='container'>
      <div class={`${side}-chat-bubble`}>{escapeMessage(message)}</div>
    </div>
  );
}

/*
 * Returns the formatted time stamp.
 */
export function getTimeString(time) {
  return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

export function escapeMessage(message) {
  // Escape "<"
  let lt_re = new RegExp('<', 'g');
  message = message.replace(lt_re, '&lt');

  // Escape ">"
  let gt_re = new RegExp('>', 'g');
  message = message.replace(gt_re, '&gt');

  return message;
}

export function chatElements(currentMessage) {
  let currentText = currentMessage ? currentMessage : '';
  return ([
    <textarea id='inputBox' type='text' autocomplete='off' placeholder='Type a message...'>
      {currentText}
    </textarea>,
    <div id='sendButton'>
      <div id='sendButtonText'>Send</div>
    </div>
  ]);
}

export function chatSetup(sendMessage, isAdmin, userId, send_typing_message) {
  $('#inputBox').keydown((e) => {
    if (!isAdmin) {
      send_typing_message(true);
      if (typeof(userTypingTimeout) != 'undefined') {
        clearTimeout(userTypingTimeout);
      }
      let userTypingTimeout = setTimeout(() => {
        send_typing_message(false);
      });
    } else {
      send_typing_message(userId, true);
      if (typeof(adminTypingTimeout) != 'undefined') {
        clearTimeout(adminTypingTimeout);
      }
      let adminTypingTimeout = setTimeout(() => {
        send_typing_message(userId, false);
      }, 5000);
    }
    const ENTER = 13;
    if (e.which == ENTER && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  $('#sendButton').click(() => {
    sendMessage();
  });
}
