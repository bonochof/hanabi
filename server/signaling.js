const port = 3001;
const io = require('socket.io').listen(port);

console.log('Server is listening on port: ' + port);

io.sockets.on('connection', (socket) => {
    let roomName = '';
    let userName = '';

    console.log('socket conected')

    socket.on('enter room', (msg) => {
        const parseMsg = JSON.parse(msg);
        userName = parseMsg.userName;
        roomName = parseMsg.roomName;
        socket.join(roomName);
        const sendMsg = JSON.stringify({
            type: 'log',
            data: '"' + userName + '" entered "' + roomName + '"'
        });
        io.sockets.in(roomName).emit('room', sendMsg);
        console.log('"' + userName + '" entered "' + roomName + '"');

        if (io.sockets.adapter.rooms[roomName].length == 2) {
            const sendMsg2 = JSON.stringify({
                type: 'pair'
            });
            io.to(socket.id).emit('room', sendMsg2);
            console.log('make a pair')
        }
    });

    socket.on('P2P', (msg) => {
        socket.broadcast.to(roomName).emit('P2P', msg);
        console.log('send P2P message');
    });

    socket.on('message', (message) => {
        socket.broadcast.to(roomName).emit('message', message);
        console.log('send message')
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('user disconnected');
        console.log('user disconnected')
    });
});
