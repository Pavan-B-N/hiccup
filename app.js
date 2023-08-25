const express = require("express");
const app = express();
const port = process.env.PORT || 3030;

const dotenv=require("dotenv")
dotenv.config()

const bodyParser = require("body-parser");
const { v4: uuidV4 } = require("uuid");

const http = require("http");
const httpServer = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(httpServer);

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(httpServer);

//middlewares
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/peerjs", peerServer);


const activeRooms=[process.env.ADMIN_ROOM]
app.get("/", (req, res) => {
  res.render("home");
});
app.post("/join", (req, res) => {
  const { roomid } = req.body;
  // console.log(roomid)
  if (roomid) res.redirect("/joined" + roomid);
  else {
    res.redirect("/");
  }
});
app.get("/host", (req, res) => {
  const uniqueID=uuidV4()
  if(!(activeRooms.includes(uniqueID))){
    activeRooms.push(uniqueID)
    return res.redirect("/joined" + uniqueID);
  }
  res.redirect("/")
});
app.get("/joined:roomid", (req, res) => {
  const roomID=req.params.roomid
  if(activeRooms.includes(roomID)){
    return res.render("room", { roomId: roomID });
  }
  res.redirect("/")
});
io.on("connection", (socket) => {
  socket.emit("id", socket.id);

  socket.on("join", (data) => {
    socket.join(data.roomid);
    socket.broadcast.to(data.roomid).emit("userConnected", data);

    socket.on("disconnect", () => {
      socket.broadcast.to(data.roomid).emit("userDisconnected", data.peerid);
    });
  });
});

httpServer.listen(port, () => console.log(`App is running on port ${port}`));
