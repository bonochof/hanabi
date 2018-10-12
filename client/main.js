const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');
const startVideoBtn = document.getElementById('start_video_btn');
const stopVideoBtn = document.getElementById('stop_video_btn');
const connectBtn = document.getElementById('connect_btn');
const hangupBtn = document.getElementById('hangup_btn');

let localStream = null;
let peerConnection = null;
let negotiationneededCounter = 0;
let isOffer = false;

// シグナリングサーバへ接続する
const wsUrl = 'ws://localhost:3001/';
const ws = new WebSocket(wsUrl);
ws.onopen = (evt) => {
    console.log('ws open()');
};
ws.onerror = (err) => {
    console.error('ws onerror() ERR:', err);
};
ws.onmessage = (evt) => {
    console.log('ws onmessage() data:', evt.data);
    const message = JSON.parse(evt.data);
    switch(message.type){
        case 'offer': {
            console.log('Received offer ...');
            setOffer(message);
            break;
        }
        case 'answer': {
            console.log('Received answer ...');
            setAnswer(message);
            break;
        }
        case 'candidate': {
            console.log('Received ICE candidate ...');
            const candidate = new RTCIceCandidate(message.ice);
            console.log(candidate);
            addIceCandidate(candidate);
            break;
        }
        case 'close': {
            console.log('peer is closed ...');
            hangUp();
            break;
        }      
        default: { 
            console.log("Invalid message"); 
            break;              
         }         
    }
};

// ICE candaidate受信時にセットする
const addIceCandidate = (candidate) => {
    if (peerConnection) {
        peerConnection.addIceCandidate(candidate);
    }
    else {
        console.error('PeerConnection not exist!');
        return;
    }
};

// ICE candidate生成時に送信する
const sendIceCandidate = (candidate) => {
    console.log('---sending ICE candidate ---');
    const message = JSON.stringify({ type: 'candidate', ice: candidate });
    console.log('sending candidate=' + message);
    ws.send(message);
};

// getUserMediaでカメラ、マイクにアクセス
startVideoBtn.addEventListener('click', async () => {
    try{
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
        playVideo(localVideo,localStream);
    } catch(err){
        console.error('mediaDevice.getUserMedia() error:', err);
    }
});

// stop
stopVideoBtn.addEventListener('click', () => {
    cleanupVideoElement(localVideo);
});

// Videoの再生を開始する
const playVideo = async (element, stream) => {
    element.srcObject = stream;
    await element.play();
};

// WebRTCを利用する準備をする
const prepareNewConnection = (isOffer) => {
    const pc_config = {"iceServers":[ {"urls":"stun:stun.webrtc.ecl.ntt.com:3478"} ]};
    const peer = new RTCPeerConnection(pc_config);

    // リモートのMediStreamTrackを受信した時
    peer.ontrack = evt => {
        console.log('-- peer.ontrack()');
        playVideo(remoteVideo, evt.streams[0]);
    };

    // ICE Candidateを収集したときのイベント
    peer.onicecandidate = evt => {
        if (evt.candidate) {
            console.log(evt.candidate);
            sendIceCandidate(evt.candidate);            
        } else {
            console.log('empty ice event');
            // sendSdp(peer.localDescription);
        }
    };

    // Offer側でネゴシエーションが必要になったときの処理
    peer.onnegotiationneeded = async () => {
        try {
            if(isOffer){
                if(negotiationneededCounter === 0){
                    let offer = await peer.createOffer();
                    console.log('createOffer() succsess in promise');
                    await peer.setLocalDescription(offer);
                    console.log('setLocalDescription() succsess in promise');
                    sendSdp(peer.localDescription);
                    negotiationneededCounter++;
                }
            }
        } catch(err){
            console.error('setLocalDescription(offer) ERROR: ', err);
        }
    }

    // ICEのステータスが変更になったときの処理
    peer.oniceconnectionstatechange = function() {
        console.log('ICE connection Status has changed to ' + peer.iceConnectionState);
        switch (peer.iceConnectionState) {
            case 'closed':
            case 'failed':
                if (peerConnection) {
                    hangUp();
                }
                break;
            case 'dissconnected':
                break;
        }
    };

    // ローカルのMediaStreamを利用できるようにする
    if (localStream) {
        console.log('Adding local stream...');
        localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
    } else {
        console.warn('no local stream, but continue.');
    }

    return peer;
};

// 手動シグナリングのための処理を追加する
const sendSdp = (sessionDescription) => {
    console.log('---sending sdp ---');
     const message = JSON.stringify(sessionDescription);
     console.log('sending SDP=' + message);
     ws.send(message);     
};

// Connectボタンが押されたらWebRTCのOffer処理を開始
connectBtn.addEventListener('click', () => {
    if (! peerConnection) {
        console.log('make Offer');
        peerConnection = prepareNewConnection(true);
    }
    else {
        console.warn('peer already exist.');
    }
});

// Answer SDPを生成する
const makeAnswer = async () => {
    console.log('sending Answer. Creating remote session description...' );
    if (! peerConnection) {
        console.error('peerConnection NOT exist!');
        return;
    }
    try{
        let answer = await peerConnection.createAnswer();
        console.log('createAnswer() succsess in promise');
        await peerConnection.setLocalDescription(answer);
        console.log('setLocalDescription() succsess in promise');
        sendSdp(peerConnection.localDescription);
    } catch(err){
        console.error(err);
    }
};

// Offer側のSDPをセットする処理
const setOffer = async(sessionDescription) => {
    if (peerConnection) {
        console.error('peerConnection alreay exist!');
    }
    peerConnection = prepareNewConnection(false);
    try{
        await peerConnection.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(answer) succsess in promise');
        makeAnswer();
    } catch(err){
        console.error('setRemoteDescription(offer) ERROR: ', err);
    }
};

// Answer側のSDPをセットする場合
const setAnswer = async (sessionDescription) =>  {
    if (! peerConnection) {
        console.error('peerConnection NOT exist!');
        return;
    }
    try{
        await peerConnection.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(answer) succsess in promise');
    } catch(err){
        console.error('setRemoteDescription(answer) ERROR: ', err);
    }
};

// P2P通信を切断する
hangupBtn.addEventListener('click', () => {
    hangUp();
});

const hangUp = () => {
    if (peerConnection) {
        if(peerConnection.iceConnectionState !== 'closed'){
            peerConnection.close();
            peerConnection = null;
            negotiationneededCounter = 0;
            const message = JSON.stringify({ type: 'close' });
            console.log('sending close message');
            ws.send(message);
            cleanupVideoElement(remoteVideo);
            return;
        }
    }
    console.log('peerConnection is closed.');
};

// ビデオエレメントを初期化する
const cleanupVideoElement = (element) => {
    element.pause();
    element.srcObject = null;
};
