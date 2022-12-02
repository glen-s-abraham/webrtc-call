const socket = io('https://192.168.5.49:8000');
const Peer = require('simple-peer');

let curUserName;
let isInitiator = false;
let localPeer;
let localSdp;
let chatWith = '';
let isChatting = false;
const userMessages = new Map();


//dom elements
const onlineUsers = document.querySelector('#onlineUsers');
const audio = document.querySelector('#audio');
const lobby = document.querySelector('#lobby');
const call = document.querySelector('#call');
const callConfirmation = document.querySelector('#callConfirmation');
const btnDisconnect = document.querySelector('#btnDisconnect');
const btnAccept = document.querySelector('#btnAccept');
const btnReject = document.querySelector('#btnReject');
const chat = document.querySelector('#chat');
const messages = document.querySelector('#messages');
const btnSend = document.querySelector('#btnSend');
const btnClose = document.querySelector('#btnClose');
const txtMessage = document.querySelector('#txtMessage');
const userName = document.querySelector('#userName');


//User persistence
const setupUser = () => {
    curUserName = sessionStorage.getItem('userName') || prompt('Enter a User Name?');
    if (!sessionStorage.getItem('userName')) sessionStorage.setItem('userName', curUserName);
    //Register username on socket server
    socket.emit('userJoin', curUserName);
    userName.innerText = curUserName

}

const resetUser = (userName) => {
    alert(`User with ${userName} already exist.Please choose another name.`)
    sessionStorage.removeItem('userName');
    setupUser();
}

setupUser();
socket.on('userAlreadyExist', userName => resetUser(userName));


const initiateCall = (toUser, stream) => {
    isInitiator = true;
    //disconnection logic
    if (localPeer) localPeer = null;
    localPeer = new Peer({ initiator: true, trickle: false, stream: stream });
    localPeer.on('signal', (data) => {
        localSdp = JSON.stringify(data);
        console.log(`Fetched from sdp: ${localSdp}`);
        socket.emit('offer', localSdp, toUser, curUserName);
    });
    localPeer.on('data', data => {
        console.log(`got a message from ${curUserName}:` + data)
    })
    localPeer.on('stream', stream => {
        audio.srcObject = stream;
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
    }).then(stream => initiateCall(callTo, stream)).catch((err) => { console.log(err); alert(err) });
}

const handleBtnChatClick = (userName) => {
    chatWith = userName// event.target.dataset.username;
    chat.style.display = 'block'
    lobby.style.display = "none";
    isChatting = true;
    console.log(chatWith);
    messages.innerHTML="";
    let existingMessages = userMessages.get(chatWith);
    if(existingMessages){
        existingMessages.forEach(message=>{
            messages.insertAdjacentHTML('beforeend',`<br><span>${message} </span>`);
        })
    }
}

socket.on('usersOnline', users => {
    console.log(users);
    users.forEach(user=>{
        let existingMessages = userMessages.get(user);
        if(existingMessages===undefined){
            userMessages.set(user,[]);
        }
    })
    onlineUsers.innerHTML = users.reduce((elems, user) => {
        if (user === curUserName) return elems;
        return elems + `<li>${user} <button class="btnCall", data-username ="${user}">Make call</button><button class="btnChat", data-username ="${user}">Message</button></li>`
    }, '');
    Array.from(document.querySelectorAll('.btnCall')).forEach(elem => {
        elem.addEventListener('click', (evt) => handleBtnCallClick(evt));
    })
    Array.from(document.querySelectorAll('.btnChat')).forEach(elem => {
        elem.addEventListener('click', (evt) => handleBtnChatClick(evt.target.dataset.username));
    })
})

const handleOffer = (offer, fromUser, stream) => {
    isInitiator = false;

    //disconnection logic

    if (localPeer) localPeer = null
    localPeer = new Peer({ trickle: false, stream: stream })
    localPeer.on('signal', (data) => {
        localSdp = JSON.stringify(data);
        socket.emit('answer', localSdp, callFrom, curUserName);
    });
    localPeer.on('data', data => {
        console.log(`got a message from ${curUserName}:` + data)
    })
    localPeer.on('stream', stream => {
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
    btnAccept.addEventListener("click", (evt) => {
        navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        }).then(stream => handleOffer(offer, fromUser, stream)).catch((err) => { console.log(err); alert(err); })
    })

})

let callTo;
socket.on("answer", (answer, toUser) => {
    console.log(toUser + ':' + answer);
    callTo = toUser;
    localPeer.signal(answer);
})


btnDisconnect.addEventListener("click", (evt) => {
    console.log("btn disconnect")
    if (isInitiator) socket.emit('disconnectCall', callTo);
    else socket.emit('disconnectCall', callFrom);
    localPeer.destroy();
    localPeer = null;
    lobby.style.display = "block";
    call.style.display = "none"
    callConfirmation.style.display = "none";
})

btnReject.addEventListener("click", (evt) => {
    console.log("btn disconnect")
    socket.emit('disconnectCall', callFrom);
    localPeer = null;
    lobby.style.display = "block";
    call.style.display = "none"
    callConfirmation.style.display = "none";
})

socket.on("disconnectCall", () => {
    console.log('event fired')
    localPeer.destroy();
    localPeer = null;
    lobby.style.display = "block";
    call.style.display = "none"
    callConfirmation.style.display = "none";
})

btnClose.addEventListener('click', (evt) => {
    chatWith = '';
    chat.style.display = 'none'
    lobby.style.display = "block";
    isChatting=false;
})

btnSend.addEventListener('click', (evt) => {
    let message = txtMessage.value;
    console.log(message)
    if (message) {
        messages.insertAdjacentHTML('beforeend',`<br><span>${curUserName}:${message} </span>`);
        let existingMsgs = userMessages.get(chatWith);
        userMessages.set(chatWith,existingMsgs.concat(`${curUserName}:${message}`));
        txtMessage.value = "";
        socket.emit("message",message,curUserName,chatWith);
    }
})

socket.on("message",(message,fromUser)=>{
    if(!isChatting) handleBtnChatClick(fromUser);
    let existingMsgs = userMessages.get(chatWith);
    userMessages.set(chatWith,existingMsgs.concat(`${fromUser}:${message}`));
    if (message && fromUser===chatWith) {
        messages.innerHTML += `<br><span>${fromUser}:${message} </span>`
        txtMessage.value = ""
    }
})