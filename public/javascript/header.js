function generateAdminHeader() {
	generateHeader('admin');
}

function generateUserHeader() {
	generateHeader('user');
}

function generateHeader(role) {
	const href = (role === 'user' ? '/' : '/admin');
	const login = '/admin/login';
	const logout = '/admin/logout';
	const buttons = (role === 'user' ? `
			<a href='/help' target='_blank'>help</a>
			<a href='http://sites.tufts.edu/ears4peers/contact-us/' target='_blank'>Feedback</a>
			<a href='${login}'>Login</a>
		` : `
			<a href='${logout}'>Logout</a>
		`);
	$('.topnav').first().html(`
		<a class='active' href='${href}'>E4P</a>
		<div class='topnav-right'>
			${buttons}
		</div>
	`);
}
