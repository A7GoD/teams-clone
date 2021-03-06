const express = require("express");
const http = require("http");
const app = express();
const path=require("path");
const server = http.createServer(app);
const socket = require("socket.io");
const io = require("socket.io")(server, {
  cors: {
   
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
  allowEIO3: true,
});

const port = process.env.PORT||8000;
const users = {};

const socketToRoom = {};

io.on("connection", (socket) => {
  socket.on("join room", (roomID) => {

    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 4) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }

    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);


    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnectPeer", () => {

    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    socket.broadcast.emit("user-left", socket.id);
  });

  socket.on("raise-hand", () => {
      socket.broadcast.emit("raise-hand-toggle",socket.id);
  });
});

// const pathInde=path.join(__currDirectory)
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
