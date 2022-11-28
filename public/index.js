const socket = io();
const Peer = require('simple-peer');

let curUserName;
let isInitiator = false;
let localPeer;
let localSdp;

//dom elements
const onlineUsers = document.querySelector('#onlineUsers');
const audio = document.querySelector('#audio');
const lobby = document.querySelector('#lobby');
const call = document.querySelector('#call');
const callConfirmation = document.querySelector('#callConfirmation');
const btnDisconnect =  document.querySelector('#btnDisconnect');
const btnAccept = document.querySelector('#btnAccept');
const btnReject = document.querySelector('#btnReject');

//User persistence
const setupUser = () => {
    curUserName = sessionStorage.getItem('userName') || prompt('Enter a User Name?');
    if (!sessionStorage.getItem('userName')) sessionStorage.setItem('userName', curUserName);
    //Register username on socket server
    socket.emit('userJoin', curUserName);
}

const resetUser = (userName) => {
    alert(`User with ${userName} already exist.Please choose another name.`)
    sessionStorage.removeItem('userName');
    setupUser();
}

setupUser();
socket.on('userAlreadyExist', userName => resetUser(userName));


const initiateCall = (toUser,stream) => {
    isInitiator = true;
    //disconnection logic
    if (localPeer) localPeer = null;
    localPeer = new Peer({ initiator: true, trickle: false,stream:stream });
    localPeer.on('signal', (data) => {
        localSdp = JSON.stringify(data);
        console.log(`Fetched from sdp: ${localSdp}`);
        socket.emit('offer', localSdp, toUser, curUserName);
    });
    localPeer.on('data', data => {
        console.log(`got a message from ${curUserName}:` + data)
    })
    localPeer.on('stream',stream=>{
        audio.srcObject = stream;
        alert(stream.id);
    })
    lobby.style.display = "none";
    call.style.display = "block"
}



const handleBtnCallClick = (event) => {
    const callTo = event.target.dataset.username;
    console.log(`Initiating call to ${callTo}`);
    navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
    }).then(stream=>initiateCall(callTo,stream)).catch((err) => {console.log(err);alert(err)});
}

socket.on('usersOnline', users => {
    console.log(users);
    onlineUsers.innerHTML = users.reduce((elems, user) => {
        if (user === curUserName) return elems;
        return elems + `<li>${user} <button class="btnCall", data-username ="${user}">Make call</button></li>`
    }, '');
    Array.from(document.querySelectorAll('.btnCall')).forEach(elem => {
        elem.addEventListener('click', (evt) => handleBtnCallClick(evt));
    })
})

const handleOffer = (offer, fromUser, stream)=>{
    isInitiator = false;
   
    //disconnection logic

    if (localPeer) localPeer = null
    localPeer = new Peer({ trickle: false,stream:stream })
    localPeer.on('signal', (data) => {
        localSdp = JSON.stringify(data);
        socket.emit('answer', localSdp, callFrom, curUserName);
    });
    localPeer.on('data', data => {
        console.log(`got a message from ${curUserName}:` + data)
    })
    localPeer.on('stream',stream=>{
        audio.srcObject = stream;
    })
    console.log(fromUser + ':' + JSON.parse(offer))
    localPeer.signal(JSON.parse(offer));
    lobby.style.display = "none";
    call.style.display = "block"
    callConfirmation.style.display = "none";
}
let callFrom;
socket.on('offer', (offer, fromUser) => {
    lobby.style.display = "none";
    callConfirmation.style.display = "block"
    callFrom = fromUser;
    btnAccept.addEventListener("click",(evt)=>{
        navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        }).then(stream=>handleOffer(offer, fromUser,stream)).catch((err) =>{console.log(err);alert(err);})
    })
 
})

let callTo;
socket.on("answer", (answer, toUser) => {
    console.log(toUser + ':' + answer);
    callTo = toUser;
    localPeer.signal(answer);
})

document.getElementById('ping').addEventListener('click',()=>{
    localPeer.send(`shit mf connected mf`);
});

btnDisconnect.addEventListener("click",(evt)=>{
    console.log("btn disconnect")
    if(isInitiator) socket.emit('disconnectCall',callTo);
    else socket.emit('disconnectCall',callFrom);
    localPeer.destroy();
    localPeer = null;
    lobby.style.display = "block";
    call.style.display = "none"
    callConfirmation.style.display = "none"; 
})

btnReject.addEventListener("click",(evt)=>{
    console.log("btn disconnect")
    socket.emit('disconnectCall',callFrom);
    localPeer = null;
    lobby.style.display = "block";
    call.style.display = "none"
    callConfirmation.style.display = "none"; 
})

socket.on("disconnectCall",()=>{
    console.log('event fired')
    localPeer.destroy();
    localPeer = null;
    lobby.style.display = "block";
    call.style.display = "none" 
    callConfirmation.style.display = "none";
})