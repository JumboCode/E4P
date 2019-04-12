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
  AudioContextChat = window.AudioContext || window.webkitAudioContext;
  audioContextChat = new AudioContextChat();
  audioElementChat = document.getElementById('newChatSound');
  trackChat = audioContextChat.createMediaElementSource(audioElementChat);
  trackChat.connect(audioContextChat.destination);
  chatSoundSetup = true;
  document.getElementById('enableNewChatAlert').innerHTML = '';

  audioElementChat.addEventListener('ended', () => {
    newChatSoundLoop();
  }, false);


}

function chatSound() {
  document.getElementById('enableNewChatAlert').innerHTML = '';
  if (isChrome()) {
    if (!chatSoundSetup) {
      document.getElementById('enableNewChatAlert').innerHTML = chromeAlertButton();
    } else {
      audioElementChat.play();
    }
  } else{
    if (!chatSoundSetup) {
      setupChatSound();
    }
    audioElementChat.play();
  }
}

function enableChromeAlerts() {
  setupChatSound();
  newChatSoundLoop();
}

function newChatSoundLoop() {
  if (chatSoundSetup) {
    let isUnacceptedChat = false;
    for (chat of chats) {
      if (!chat.accepted) {
        isUnacceptedChat = true;
      }
    }
    if (isUnacceptedChat) {
      audioElementChat.play();
    }
  }
}

