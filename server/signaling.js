const WebSocketServer = require('ws').Server;
const port = 3001;
const wsServer = new WebSocketServer({ port: port });

let connects = [];

wsServer.on('connection', (ws) => {
    console.log('-- websocket connected --');
    connects.push(ws)

    ws.on('message', (message) => {
        wsServer.clients.forEach(function each(client) {
            if (isSame(ws, client)) {
                console.log('- skip sender -');
            }
            else {
                client.send(message);
                console.log('sended message');
            }
        });
    });

    ws.on('close', () => {
        console.log('stopping client send "close"');

        // exclude connection broken socket from array
        connects = connects.filter(function (conn, i) {
            return (conn === ws) ? false : true;
        });

    });
});

const isSame = (ws1, ws2) => {
    // compare object
    return (ws1 === ws2);
};

console.log('websocket server start. port=' + port);