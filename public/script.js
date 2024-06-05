const socket = io("/");
let peerid;
let socketId;
let localStream;

const remoteStreamArray = [];
const callObjects = [];
const peer = new Peer(undefined, {
    host: 'localhost',
    port: "3030",
    path: "/peerjs"
})
// const peer = new Peer(undefined, {
//   host: "hiccup.adaptable.app",
//   port: "",
//   path: "/peerjs",
// });
socket.on("id", (id) => {
  socketId = id;
  console.log(id)
});

function cam(){
  navigator.mediaDevices
  .getUserMedia(constraints)
  .then((stream) => {
    localStream = stream;
    var video = document.createElement("video");
    video.muted = true;
    addVideoToGrid(stream, video);
  })
}

peer.on("open", (id) => {
  alert(id)
  if (socketId) {
    socket.emit("join", {
      roomid: roomid,
      peerid: id,
    });
  }
});

const constraints = {
  video: true,
  audio: true,
};
navigator.mediaDevices
  .getUserMedia(constraints)
  .then((stream) => {
    localStream = stream;
    var video = document.createElement("video");
    video.muted = true;
    addVideoToGrid(stream, video);

    peer.on("call", (call) => {
      var video = document.createElement("video");
      console.log("receiving");
      call.answer(stream);
      call.on("stream", (remoteStream) => {
        console.log("remoteStream=", remoteStream);
        if (!remoteStreamArray.includes(remoteStream.id)) {
          callObjects.push(call);
          remoteStreamArray.push(remoteStream.id);
          addVideoToGrid(remoteStream, video);
        }
      });
      call.on("close", () => {
        console.log("call ended");
        video.remove();
      });
    });
  })
  .catch((err) => {
    console.log("error occured during accessing local camera", err);
  });

peer.on("error", (err) => {
  alert("peer connection error");
  console.log(err);
});

//peer.call refer userConnected socket event

socket.on("userConnected", (data) => {
  console.log("calling", data.peerid, localStream);
  const call = peer.call(data.peerid, localStream);
  var video = document.createElement("video");
  call.on("stream", (remoteStream) => {
    console.log("remoteStream=", remoteStream);
    if (!remoteStreamArray.includes(remoteStream.id)) {
      remoteStreamArray.push(remoteStream.id);
      callObjects.push(call);
      addVideoToGrid(remoteStream, video);
    }
  });
  call.on("close", () => {
    console.log("call ended");
    video.remove();
  });
});

function addVideoToGrid(stream, video) {
  const grid = document.getElementById("videoGrid");
  grid.appendChild(video);
  video.srcObject = stream;

  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
}

socket.on("userDisconnected", (peer) => {
  callObjects.map((obj, index) => {
    console.log("obj.peer=", obj.peer);
    console.log("peer=", peer);
    console.log(peer == obj.peer);
    if (peer == obj.peer) {
      callObjects[index].close();
    }
  });
});

function closeConnection() {
  callObjects[0].close();
}

let micBtn = document.getElementById("mute");
let vidBtn = document.getElementById("pause");

function muteMic() {
  const audio = localStream.getTracks().find((track) => track.kind === "audio");
  if (audio.enabled) {
    audio.enabled = false;
  } else {
    audio.enabled = true;
  }

  if (micBtn.innerText === "mic") {
    micBtn.innerText = "mic_off";
  } else if (micBtn.innerText === "mic_off") {
    micBtn.innerText = "mic";
  }
}
function pauseVideo() {
  const video = localStream.getTracks().find((track) => track.kind === "video");
  if (video.enabled) {
    video.enabled = false;
  } else {
    video.enabled = true;
  }

  if (vidBtn.innerText == "videocam") {
    vidBtn.innerText = "videocam_off";
  } else if (vidBtn.innerText === "videocam_off") {
    vidBtn.innerText = "videocam";
  }
}

function copyText() {
  navigator.clipboard.writeText("https://hiccup.adaptable.app/joined"+roomid)
  .then(()=>{
    console.log("https://hiccup.adaptable.app/joined"+roomid)
  })
}

function handleEndup() {
  window.location.href = "/";
}



function shareScreen() {
  navigator.mediaDevices.getDisplayMedia({ video: true })
      .then(async stream => {
          const screenTrack = stream.getTracks()[0];
       addScreen(stream)
          if (localStream) { 
              console.log("added track")
              localStream.addTrack(screenTrack)
          }
          else {
              localStream = stream;
          }
      })
}

function addScreen(stream) {
  const screenGrid = document.getElementById("screen")
  const video = document.createElement("video")
  screenGrid.appendChild(video)
  video.srcObject = stream
  video.classList="screen"
  video.addEventListener("loadedmetadata", () => {
      video.play()
  })
}