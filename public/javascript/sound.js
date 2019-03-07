let AudioContextMessage, audioContextMessage, audioElementMessage, trackMessage;
let messageSoundSetup = false;
let AudioContextChat, audioContextChat, audioElementChat, trackChat;
let chatSoundSetup = false;

function setupMessageSound() {
  AudioContextMessage = window.AudioContext || window.webkitAudioContext;
  audioContextMessage = new AudioContextMessage();
  audioElementMessage = document.getElementById('newMessageSound');
  trackMessage = audioContextMessage.createMediaElementSource(audioElementMessage);
  trackMessage.connect(audioContextMessage.destination);
  messageSoundSetup = true;    
}

function messageSound() {
  if (!messageSoundSetup) { setupMessageSound(); }
  audioElementMessage.play();
}

function setupChatSound() {
  if (!chatSoundSetup) {
    AudioContextChat = window.AudioContext || window.webkitAudioContext;
    audioContextChat = new AudioContextChat();
    audioElementChat = document.getElementById('newChatSound');
    trackChat = audioContextChat.createMediaElementSource(audioElementChat);
    trackChat.connect(audioContextChat.destination);
    chatSoundSetup = true;
  } 
}

function chatSound() {
  setupChatSound();
  audioElementChat.play();
}
