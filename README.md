HANABI
===

Multiplay boardgame by Unity

## Reference
[webRTCハンズオン](https://github.com/yusuke84/webrtc-handson-2016)
[Socket.IOで始めるWebSocket超入門](http://www.atmarkit.co.jp/ait/series/3113/)

## Prepare
```
npm install ws express
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
Access to '[http://localhost:8000](http://localhost:8000)'

※Every browser supports webRTC 1.0, but we are developing it for Chrome or Firefox

## Authors
* [bonochof](https://github.com/bonochof)
* [kakke18](https://github.com/kakke18)
