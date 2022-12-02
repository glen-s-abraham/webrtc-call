const express = require('express');
const socketIo = require('socket.io');
const path = require('path');
const cron = require('node-cron');
const app = express();
const https = require('https');
const fs = require('fs');

const port = 8000;



const userSocketMap = new Map();

app.use(express.static(path.join(__dirname, "/public")))

app.get('/ping', (req, res) => {
    res.status(200).send('alive');
})


let server = https.createServer({
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.cert')
  }, app).listen(port, () => {
    console.log(`socket server listeing on ${port}`);
  });


const io = socketIo(server,{
    cors:{
        origin:'*'
    },
    path:"/"
});

io.on('connect', socket => {
    socket.on('userJoin', (userName) => {
        if (userSocketMap.get(userName)) {
            socket.emit('userAlreadyExist', userName);
        } else {
            userSocketMap.set(userName, socket.id);
            console.log(`User ${userName} registeed on socket ${socket.id}`);
            io.emit('usersOnline',Array.from(userSocketMap.keys()));
        }
    })
    socket.on('offer',(offer,toUser,fromUser)=>{
        socket.to(userSocketMap.get(toUser)).emit('offer',offer,fromUser);
        console.log(fromUser,':',userSocketMap.get(fromUser))
        console.log(offer)
    })
    socket.on('answer',(answer,fromUser,toUser)=>{
        console.log("answer trigerred",toUser);
        socket.to(userSocketMap.get(fromUser)).emit('answer',answer,toUser);
        console.log(toUser,':',userSocketMap.get(toUser))
    })
    socket.on("disconnectCall",(user)=>{
        socket.to(userSocketMap.get(user)).emit("disconnectCall");
    });
    socket.on("message",(message,fromUser,toUser)=>{
        socket.to(userSocketMap.get(toUser)).emit("message",message,fromUser);
    })
})



//disconnect cron job-need to do r&d regarding socket.io disconnects
cron.schedule("*/2 * * * * *", ()=>{
    let users = Array.from(userSocketMap.keys());
    
        if(users.length>0){    
            users.forEach(user=>{
                let userSocket = io.sockets.sockets.get(userSocketMap.get(user));
                if(!userSocket){
                    userSocketMap.delete(user);
    
                    console.log(`removed inactive user: ${user}`)
                    
                }
            })
        }
});