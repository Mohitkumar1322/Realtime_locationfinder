const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const socket = require('socket.io');
const server = http.createServer(app);
const io = socket(server);

// Set the view engine to ejs
app.set("view engine", "ejs");
// Set the directory where the template files are located
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket) {
    console.log('a user connected');
    
    socket.on('sendLocation', function(data) {
        console.log('Location received:', data);
        io.emit('updateLocation', {id : socket.id, ...data});
    });

    socket.on('disconnect', function() {
        io.emit('removeMarker', socket.id);
        console.log('user disconnected');
    });
});

app.get('/', function(req, res) {
    res.render('index'); // Renders the index.ejs file
});

server.listen(3000, function() {
    console.log('Server is listening on port 3000');
});
