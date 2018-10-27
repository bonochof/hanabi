HANABI
===

Multiplay boardgame

## Reference
[webRTCハンズオン](https://github.com/yusuke84/webrtc-handson-2016)

[Socket.IOで始めるWebSocket超入門](http://www.atmarkit.co.jp/ait/series/3113/)

## Prepare
```
npm install socket.io
```

## Usage
```
node server/signaling.js
cd client
(Python3.x)
python -m htpp.server 8000
(Python2.x)
python -m SimpleHTTPServer 8000
(PHP)
php -S localhost:8000
```

Access to [http://localhost:8000](http://localhost:8000).

Input 'name' and 'room'.

If there is a person who inputsthe same room name, P2P connection is astabilished by pressing the 'connect' button.

※ Every browser supports webRTC 1.0 but we are developing it for Chrome or Firefox

## Authors
* [bonochof](https://github.com/bonochof)
* [kakke18](https://github.com/kakke18)
