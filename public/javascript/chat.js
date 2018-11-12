/*
 * Return a message div based on the role and message string.
 */
function createMessageDiv(side, message) {
    return "<div class= 'container'><div class='" + side + "-chat-bubble'> " + message + "</div></div>";
}
