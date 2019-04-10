function generateAdminHeader() {
  generateHeader('admin');
}

function generateUserHeader() {
  generateHeader('user');
}

function generateLoginHeader() {
  generateHeader('login_page');
}

function generateHeader(role) {
  const home = '/';
  const login = '/admin/login';
  const logout = '/admin/logout';
  let buttons;
  let chatAlertButton = '';

  if (role === 'user') {
    buttons ='<li class="nav-item"><a class="nav-link" href="https://sites.tufts.edu/ears4peers/" target="_blank">More Resources</a></li>' +
    '<li class="nav-item"><a class="nav-link" href="https://docs.google.com/forms/d/1Mc05Fy2hl8P-2JZ0q4O1n35D_NmB6ggbEcP5uJiThe4/viewform?fbclid=IwAR0q_TtEqIwlQHmdFgqUrw5t8egM6W6Ykah8aSqNTU5umALTk0KkOrvbc-w&edit_requested=true" target="_blank">Feedback</a></li>' +
    '<li class="nav-item"><a class="nav-link" href=' + login + '>Admin</a></li>';
  } else if (role === 'login_page') {
    buttons = '<li class="nav-item"><a class="nav-link" href="https://sites.tufts.edu/ears4peers/" target="_blank">More Resources</a></li>' +
    '<li class="nav-item"><a class="nav-link" href="https://docs.google.com/forms/d/1Mc05Fy2hl8P-2JZ0q4O1n35D_NmB6ggbEcP5uJiThe4/viewform?fbclid=IwAR0q_TtEqIwlQHmdFgqUrw5t8egM6W6Ykah8aSqNTU5umALTk0KkOrvbc-w&edit_requested=true" target="_blank">Feedback</a></li>';
  } else {
    buttons = '<li class="nav-item"><a class="nav-link" href="' + logout + '">Logout</a></li>';
    chatAlertButton = isChrome() ? '<div id="enableNewChatAlert">' +  chromeAlertButton() + '</div>' : '<div id="enableNewChatAlert"></div>';
  }

  document.getElementsByClassName('navbar')[0].innerHTML = 
    '<a class="navbar-brand" href="' + home + '">E4P</a>'
    + chatAlertButton
    + '<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">'
    + '<span class="navbar-toggler-icon"></span></button>'
    + '<div class="collapse navbar-collapse" id="navbarSupportedContent"><ul class="navbar-nav ml-auto" style="color: black">'
    +   buttons
    + '</ul></div>';

  if (role == 'admin' && isChrome()) {
    chromeAlertButton();
  }
}

function isChrome() {
  return ( navigator.userAgent && navigator.userAgent.indexOf('Chrome') !== -1 );
}

function chromeAlertButton() {
  return '<button class="navbar-brand navbar-button" id="enableAlertButton" onclick="enableChromeAlerts()">Enable All Sounds</button>';
}
