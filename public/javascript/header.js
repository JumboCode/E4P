function generateAdminHeader() {
	generateHeader('admin');
}

function generateUserHeader() {
	generateHeader('user');
}

function generateHeader(role) {
	href = role === 'user' ? '/' : '/admin';
	login = '/admin/login';
	logout = '/admin/logout';
	buttons = role === 'user' ? 
		"<a href='/help' target='_blank'>Help</a>" +
		"<a href='http://sites.tufts.edu/ears4peers/contact-us/' target='_blank'>Feedback</a>" +
		"<a href=" + login + ">Login</a>" :
		"<a href=" + logout + ">Logout</a>";

	document.getElementsByClassName("topnav")[0].innerHTML = 
		"<a class='active' href='" + href + "'>E4P</a>"
		+ "<div class='topnav-right'>"
		+ 	buttons
		+ "</div>";
}
