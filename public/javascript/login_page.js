function getUserInfo() {
	var username = document.getElementById("myText").value;
	var password = document.getElementById("myPwd").value;

	//alert("Username = " + username.value + "\nPassword = " + password.value);
	$.post('/login', {username: username, password: password}, function(res) {
		// window.location = window.location.origin + "/admin";
	});
}