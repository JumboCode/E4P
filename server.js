const express = require('express');
const path = require('path');

const app = express();

app.get('/', function(req, res) {
	res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});

app.get('/admin', function(req, res) {
	res.sendFile('admin.html', {root: path.join(__dirname, 'public')});
});

app.listen(3000, () => console.log('App is running on port 3000'));