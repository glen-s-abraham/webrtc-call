const express = require('express');
const socketIo = require('socket.io');
const path = require('path');
const cron = require('node-cron');
const app = express();




const userSocketMap = new Map();

app.use(express.static(path.join(__dirname, "/public")))

app.get('/ping', (req, res) => {
    res.status(200).send('alive');
})


const server = app.listen(8000, () => console.log('listening on port 8000'));

const io = socketIo(server);

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
})



//disconnect cron job-need to do r&d regarding socket.io disconnects
cron.schedule("*/2 * * * * *", ()=>{
    let clients = Array.from(clientSocketLookup.keys());
    
        if(clients.length>0){    
            clients.forEach(client=>{
                let clientSocket = io.sockets.sockets.get(clientSocketLookup.get(client));
                if(!clientSocket){
                    clientSocketLookup.delete(client);
    
                    console.log(`removed inactive user: ${client}`)
                    
                }
            })
        }
});