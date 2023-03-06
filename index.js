const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());

// const PORT = 5000;


const users = {};

const socketToRoom = {};

app.get("/", (req, res) => {
  res.send("Server is running");
});

//SOCKET CONFIGURATION

io.on("connection", (socket) => {
  // JOIN ROOM EVENT
  socket.on("join room", (roomID) => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 10) {
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
    const roomID = socketToRoom[socket.id];
    const usersInThisRoom = users[roomID];
  
    // Check if the user is still in the room
    if (usersInThisRoom.includes(payload.userToSignal)) {
      io.to(payload.userToSignal).emit("user joined", {
        signal: payload.signal,
        callerID: payload.callerID,
      });
    } else {
      console.log("User not found in room:", payload.userToSignal);
    }
  });
  

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  // DISCONNECT EVENT
  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    socket.broadcast.emit("user left", socket.id);
  });
});

server.listen( 5000, () => console.log(`Server listening on port  5000`));
