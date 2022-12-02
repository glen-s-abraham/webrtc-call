const express = require('express');
const path = require('path');
const app = express();
const https = require('https');
const fs = require('fs');

const port = 3000;



const userSocketMap = new Map();

app.use(express.static(path.join(__dirname, "/public")))

let server = https.createServer({
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.cert')
  }, app).listen(port, () => {
    console.log(`socket server listeing on ${port}`);
  });
