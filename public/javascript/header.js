function generateAdminHeader() {
	generateHeader('admin');
}

function generateUserHeader() {
	generateHeader('user');
}

function generateHeader(role) {
	href = role === 'user' ? '/' : '/admin';

	buttons = role === 'user' ? 
		"<a href='/help'>Help</a><a href='/help'>Feedback</a>" :
		"<button>Logout</button>";

	document.getElementsByClassName("topnav")[0].innerHTML = 
		"<a class='active' href='" + href + "'>E4P</a>"
		+ "<div class='topnav-right'>"
		+ buttons
		+ "</div>";
}