const port = 3001;
const io = require('socket.io').listen(port);

console.log('Server is listening on port: ' + port);

io.sockets.on('connection', (socket) => {
    console.log('socket conected')
    socket.on('message', (message) => {
        socket.broadcast.emit('message', message);
        console.log('send message')
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('user disconnected');
        console.log('user disconnected')
    });
});
