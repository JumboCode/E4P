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
		buttons ="<a href='/help' target='_blank'>Help</a>" +
		"<a href='http://sites.tufts.edu/ears4peers/contact-us/' target='_blank'>Feedback</a>" +
		"<a href=" + login + ">Login</a>";
	} else if (role === 'login') {
		buttons = "<a href='/help' target='_blank'>Help</a>" +
		"<a href='http://sites.tufts.edu/ears4peers/contact-us/' target='_blank'>Feedback</a>";
	} else {
	  buttons = "<a href=" + logout + ">Logout</a>";
	}

	document.getElementsByClassName("topnav")[0].innerHTML = 
		"<a class='active' href='" + home + "'>E4P</a>"
		+ "<div class='topnav-right'>"
		+ 	buttons
		+ "</div>";
}
