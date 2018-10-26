/*
    html parts
*/
// video
const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');
// button
const startVideoBtn = document.getElementById('start_video_btn');
const stopVideoBtn = document.getElementById('stop_video_btn');
const connectBtn = document.getElementById('connect_btn');
const hangupBtn = document.getElementById('hangup_btn');

/*
    global variables
*/
let localStream = null;
let peerConnection = null;
let negotiationneededCounter = 0;
let isOffer = false;

/*
    Socket
*/
// connect server
const port = 3001;
const socket = io.connect('http://localhost:' + port + '/');

socket.on('connect', (evt) => {
    console.log('socket opened.');
    socketReady = true;
});
socket.on('message', (evt) => {
    const message = JSON.parse(evt);
    switch (message.type) {
        case 'offer':
            console.log('received offer');
            setOffer(message);
            break;
        case 'answer':
            console.log('received answer');
            setAnswer(message);
            break;
        case 'candidate':
            console.log('received ICE candidate');
            const candidate = new RTCIceCandidate(message.ice);
            addIceCandidate(candidate);
            break;
        case 'close':
            console.log('peer is closed');
            hangUp();
            break;
        default:
            console.warn("Invalid message");
            break;
    }
});

/*
    webRTC
*/
const addIceCandidate = (candidate) => {
    if (peerConnection) {
        peerConnection.addIceCandidate(candidate);
    }
    else {
        console.error('PeerConnection not exist!');
        return;
    }
};

const sendIceCandidate = (candidate) => {
    console.log('sending ICE candidate');
    const message = JSON.stringify({ type: 'candidate', ice: candidate });
    socket.json.send(message);
};

const prepareNewConnection = (isOffer) => {
    const pc_config = { "iceServers": [{ "urls": "stun:stun.webrtc.ecl.ntt.com:3478" }] };
    const peer = new RTCPeerConnection(pc_config);

    // receive remote MediStreamTrack
    peer.ontrack = evt => {
        console.log('peer.ontrack()');
        playVideo(remoteVideo, evt.streams[0]);
    };

    // collection ICE Candidate
    peer.onicecandidate = (evt) => {
        if (evt.candidate) {
            console.log(evt.candidate);
            sendIceCandidate(evt.candidate);
        } else {
            console.log('empty ice event');
        }
    };

    // need negotiation (offer side)
    peer.onnegotiationneeded = async () => {
        try {
            if (isOffer) {
                if (negotiationneededCounter === 0) {
                    let offer = await peer.createOffer();
                    console.log('createOffer() succsess in promise');
                    await peer.setLocalDescription(offer);
                    console.log('setLocalDescription() succsess in promise');
                    const message = JSON.stringify(peer.localDescription);
                    console.log('sending SDP=' + message);
                    socket.json.send(message);
                    negotiationneededCounter++;
                }
            }
        } catch (err) {
            console.error('setLocalDescription(offer) ERROR: ', err);
        }
    }

    // change ICE status
    peer.oniceconnectionstatechange = function () {
        console.log('ICE connection Status has changed');
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

    // use local MediaStream
    if (localStream) {
        console.log('Adding local stream...');
        localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
    } else {
        console.warn('no local stream, but continue.');
    }

    return peer;
};

const makeAnswer = async () => {
    console.log('sending Answer. Creating remote session description...');
    if (!peerConnection) {
        console.error('peerConnection NOT exist!');
        return;
    }
    try {
        let answer = await peerConnection.createAnswer();
        console.log('createAnswer() succsess in promise');
        await peerConnection.setLocalDescription(answer);
        console.log('setLocalDescription() succsess in promise');
        const message = JSON.stringify(peerConnection.localDescription);
        console.log('sending SDP=' + message);
        socket.json.send(message);
    } catch (err) {
        console.error(err);
    }
};

const setOffer = async (sessionDescription) => {
    if (peerConnection) {
        console.error('peerConnection alreay exist!');
    }
    peerConnection = prepareNewConnection(false);
    try {
        await peerConnection.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(answer) succsess in promise');
        makeAnswer();
    } catch (err) {
        console.error('setRemoteDescription(offer) ERROR: ', err);
    }
};

const setAnswer = async (sessionDescription) => {
    if (!peerConnection) {
        console.error('peerConnection NOT exist!');
        return;
    }
    try {
        await peerConnection.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(answer) succsess in promise');
    } catch (err) {
        console.error('setRemoteDescription(answer) ERROR: ', err);
    }
};

connectBtn.addEventListener('click', () => {
    if (!peerConnection) {
        console.log('make Offer');
        peerConnection = prepareNewConnection(true);
    }
    else {
        console.warn('peer already exist.');
    }
});

hangupBtn.addEventListener('click', () => {
    hangUp();
});

const hangUp = () => {
    if (peerConnection) {
        if (peerConnection.iceConnectionState !== 'closed') {
            peerConnection.close();
            peerConnection = null;
            negotiationneededCounter = 0;
            const message = JSON.stringify({ type: 'close' });
            console.log('sending close message');
            socket.json.send(message);
            cleanupVideoElement(remoteVideo);
            return;
        }
    }
    console.log('peerConnection is closed.');
};

// initialize video element
const cleanupVideoElement = (element) => {
    element.pause();
    element.srcObject = null;
};

/*
    media
*/
startVideoBtn.addEventListener('click', async () => {
    try {
        // access camer eith getUserMedia()
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        playVideo(localVideo, localStream);
    } catch (err) {
        console.error('mediaDevice.getUserMedia() error:', err);
    }
});

stopVideoBtn.addEventListener('click', () => {
    cleanupVideoElement(localVideo);
});

const playVideo = async (element, stream) => {
    element.srcObject = stream;
    await element.play();
};
