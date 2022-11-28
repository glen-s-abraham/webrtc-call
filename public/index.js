const socket = io();
import { Peer } from "peerjs";

let curUserName;

//dom elements
const onlineUsers = document.querySelector('#onlineUsers');

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

const handleBtnCallClick=(event)=>{
    const callTo = event.target.dataset.username;
    console.log(`Initiate call to ${callTo}`);
}

socket.on('usersOnline',users=>{
    console.log(users);
    onlineUsers.innerHTML = users.reduce((elems,user)=>{
        if(user===curUserName) return elems;
        return elems+`<li>${user} <button class="btnCall", data-username ="${user}">Make call</button></li>`
    },'');
    Array.from(document.querySelectorAll('.btnCall')).forEach(elem=>{
        elem.addEventListener('click',(evt)=>handleBtnCallClick(evt));
    })
})

