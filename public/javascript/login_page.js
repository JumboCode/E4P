function getUserInfo() {
	var username = document.getElementById("myText");
	var password = document.getElementById("myPwd");
	console.log(username);
	alert("Username = " + username.value + "\nPassword = " + password.value);
}