"use strict";

const WebSocketServer = require('ws').Server;
const port = 3001;
const wsServer = new WebSocketServer({ port: port });

let connects = [];

wsServer.on('connection', function(ws) {
    console.log('-- websocket connected --');
    connects.push(ws)

    ws.on('message', function(message) {
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

    ws.on('close', function () {
        console.log('stopping client send "close"');

        // 接続切れのソケットを配列から除外
        connects = connects.filter(function (conn, i) {
            return (conn === ws) ? false : true;
        });

    });
});

function isSame(ws1, ws2) {
    // -- compare object --
    return (ws1 === ws2);
}

console.log('websocket server start. port=' + port);