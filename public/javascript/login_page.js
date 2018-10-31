function getUserInfo() {
	var username = document.getElementById("myText").value;
	var password = document.getElementById("myPwd").value;
	console.log(username);

	console.log(username)
	//alert("Username = " + username.value + "\nPassword = " + password.value);
	$.post('/login', {username: username, password: password}, function(res) {
		console.log(res)
	})
}