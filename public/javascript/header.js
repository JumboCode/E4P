function generateAdminHeader() {
  generateHeader('admin');
}

function generateUserHeader() {
  generateHeader('user');
}

function generateLoginHeader() {
  generateHeader('login');
}

function generateHeader(role) {
  home = '/';
  login = '/admin/login';
  logout = '/admin/logout';

  if (role === 'user') {
    buttons ='<li class="nav-item"><a class="nav-link" href="/help" target="_blank">Help</a></li>' +
    '<li class="nav-item"><a class="nav-link" href="http://sites.tufts.edu/ears4peers/contact-us/" target="_blank">Feedback</a></li>' +
    '<li class="nav-item"><a class="nav-link" href=" + login + ">Login</a></li>';
  } else if (role === 'login') {
    buttons = '<li class="nav-item"><a class="nav-link" href="/help" target="_blank">Help</a></li>' +
    '<li class="nav-item"><a class="nav-link" href="http://sites.tufts.edu/ears4peers/contact-us/" target="_blank">Feedback</a></li>';
  } else {
    buttons = '<li class="nav-item"><a class="nav-link" href=" + logout + ">Logout</a></li>';
  }

  document.getElementsByClassName('navbar')[0].innerHTML = 
    '<a class="navbar-brand" href="" + home + "">E4P</a>'
    + '<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">'
    + '<span class="navbar-toggler-icon"></span></button>'
    + '<div class="collapse navbar-collapse" id="navbarSupportedContent"><ul class="navbar-nav ml-auto">'
    +   buttons
    + '</ul></div>';
}
