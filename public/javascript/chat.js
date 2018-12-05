/*
 * Return a message div based on the role and message string.
 */
function createMessageDiv(side, message) {
    return "<div class= 'container'><div class='" + side + "-chat-bubble'> " + message + "</div><div class= 'time'> "+ "11:45am" +" </div></div>";
}

/*
 * Returns the formatted time stamp.
 */
function getTimeString(time) {
  return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}
