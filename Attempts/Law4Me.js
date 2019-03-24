var express = require('express');
var app = express();
var path = require('path');

// viewed at http://localhost:8000
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/documents.html'));
});

app.listen(8000);