(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const socket = io();

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


},{}]},{},[1]);
