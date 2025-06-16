import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from "react-router-dom";

const server_url = "http://localhost:8000";

var connections = {};
//to store RTCPeerConnection instances with each peer.
//connections = {
//"socketId1": RTCPeerConnection { ... },
//...
//}

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  //A WebRTC configuration object that tells each RTCPeerConnection which STUN server(s) to use.
}; //STUN servers help peers discover their public IP addresses

export default function VideoMeetComponent() {
  var socketRef = useRef(); //A React ref that will eventually hold the open Socket.IO client connection.
  // socketIdRef will store the unique ID assigned by the socket server to this particular client (a string like "G8xvT57j_3cJ4YmcAAAB")
  let socketIdRef = useRef(); //to store our own Socket.IO socket ID once we connect.
  //This object has:Methods like .emit(), .on(), .disconnect(), etc.Properties like .id, .connected, .disconnected, etc.

  let localVideoref = useRef(); //hamara video to eha pe dikhega arr baki log ke video keliye alag array bana lenge

  let [videoAvailable, setVideoAvailable] = useState(true); //permission hai ki nahi

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]); //jab video on off karenge tab yei handle karega

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(false); //niche se pop up wagera

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]); //saare messages

  let [message, setMessage] = useState(""); //jo message type karenge

  let [newMessages, setNewMessages] = useState(0); //upar ping se jo message aata hai

  let [askForUsername, setAskForUsername] = useState(true); //jab koi guest se login kar raha hoga

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  useEffect(() => {
    getPermissions();
  });

  let getDislayMedia = () => {
    if (screen) {
      //Checks if the browser supports getDisplayMedia
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          //Requests permission from the user to share their screen and audio. returna promise
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        //navigator ke andar hardware functionality, clipboard ...
        //Navigator.getUserMedia() method prompts the user for permission to use up to one video input device (such as a camera or shared screen) and up to one audio input device (such as a microphone)
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true); //if permission given then setVideoAvailable to true
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }

      //getDisplayMedia() method of the MediaDevices interface prompts the user to select and grant permission to capture the contents of a display or portion thereof (such as a window) as a MediaStream.
      if (navigator.mediaDevices.getDisplayMedia) {
        //screen sharing
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }
      //If at least one of videoAvailable or audioAvailable is true, re-calls getUserMedia({ video: videoAvailable, audio: audioAvailable }) to get the actual combined media stream
      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          //userMediaStream (or just stream) = a container for media tracks (audio/video).
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          //It stores the media stream globally by attaching it to the window object,
          // so you can access it anywhere in your browser's console or JavaScript code.
          if (localVideoref.current) {
            //localVideoRef is an object: { current: null } (initially).
            // Once the JSX element (e.g. <video>) is rendered, React assigns the actual DOM node (like the <video>) to .current
            localVideoref.current.srcObject = userMediaStream;
            //This tells the video element to show the live stream from the webcam or mic.
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("state has ", video, audio);
    }
  }, [video, audio]);

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  //this func->when I mute audio then it should mute my audio for others same for video
  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
      //purana wala stream liya arr stop kardia
    } catch (e) {
      console.log(e);
    }
    //naya stream initialize
    window.localStream = stream;
    localVideoref.current.srcObject = stream;
    //Share the stream with all other peers
    for (let id in connections) {
      if (id === socketIdRef.current) continue; //khudke id ke equal hai to skip

      connections[id].addStream(window.localStream);
      //Start the WebRTC offer-answer process to renegotiate the connection with the new stream.
      connections[id].createOffer().then((description) => {
        //Begin the offer/answer handshake for renegotiation.
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          //tell your RTCPeerConnection to use this SDP as its local description.
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
            //Once the local description is set, send it to the peer via socket so they can set it as their remote description.
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        //This fires when the track naturally ends (e.g. user stops sharing, mutes mic, or closes camera).
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }
          //Stop all tracks again (just to be safe).

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]); //Generates a blank (black) and silent stream.

          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          //Share the silent stream again with peers
          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        })
    );
  };

  let getUserMedia = () => {
    //use of this func--> jab bhi user video ban karega ya phir audio mute karega tab
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        //jab audio mute hai tab video dikhai dega sabko and vise versa
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks(); // Returns all tracks (audio and video) in the stream as an array.
        tracks.forEach((track) => track.stop());
        //This loop stops each track, which:Turns off webcam and/or microphone.Frees the device resources.Prevents continued streaming or memory leaks.
        //Stopping a track is crucial when:Leaving a page.Switching devices.Ending a WebRTC call.
        // What if you don’t stop the tracks?Even if you hide the video element or navigate away:The webcam/mic might stay active.The browser might still show the "Camera is being used" icon.
        //Resources aren't released.
      } catch (e) {
        console.log(error);
      }
    }
  };

  let getDislayMediaSuccess = (stream) => {
    console.log("HERE");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
      //Stops any existing media tracks (camera/mic) from the previous localStream. This ensures you free up the hardware before switching to screen share.
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream; //Store the new MediaStream (screen + audio) globally so other parts of your code can reference it.
    localVideoref.current.srcObject = stream; //Point your local <video> element at the new stream so the user sees their screen feed.

    //Loop over all existing peer‑connection objects
    for (let id in connections) {
      if (id === socketIdRef.current) continue; //Skip your own socket ID—no need to renegotiate with yourself.

      connections[id].addStream(window.localStream); //Use this new screen share stream for our connection to peer id

      connections[id].createOffer().then((description) => {
        //Begin the offer/answer renegotiation: generate an SDP offer that describes the new tracks.
        connections[id]
          .setLocalDescription(description)
          //Apply that SDP offer to your side of the connection.
          .then(() => {
            //Once the local description is set, send it to the remote peer (id) via your "signal" channel.
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    // This callback fires when the user stops sharing (e.g., clicks “Stop sharing” in the browser).
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            //grab whatever is playing in your <video> and stop each track to free resources
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          //Globally replace localStream with this empty placeholder.
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia(); // call your normal camera/mic acquisition logic to restore the webcam or mic stream if desired
        })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    //signal may contain an sdp block, an ice block, or both.

    //ignore any signals that you (the current client) might have accidentally sent to yourself.
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        //If the message contains an sdp field, then the peer is sending you either an offer or an answer—part of the WebRTC SDP handshake.
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          //Tell your RTCPeerConnection for fromId about the peer’s description (their offer or answer). RTCSessionDescription wraps the raw SDP string into the right WebRTC object.
          .then(() => {
            if (signal.sdp.type === "offer") {
              //check if it was an offer (as opposed to an answer). If it’s an offer, you need to generate and send back an answer.
              connections[fromId]
                .createAnswer()
                //Apply your newly created answer as the local description on your side of that peer connection.
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    //Once your local description is set, emit a "signal" event back to that same peer (fromId) carrying your answer SDP.
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      //f the parsed message contains an ice field, it means peer is sharing an ICE candidate.
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
        //Wrap that candidate in a RTCIceCandidate and hand it off to your RTCPeerConnection.
        //This helps both peers discover the best network path (NAT traversal, STUN
      }

      //SDP flow:
      // Peer A sends an offer → Peer B receives it here → setRemoteDescription → createAnswer → setLocalDescription → send answer back.
      // Peer A then calls setRemoteDescription on that answer (in its own gotMessageFromServer).

      //ICE flow:
      // As soon as each peer’s ICE agent gathers a candidate, it’s sent via the same "signal" channel, then addIceCandidate injects it into the connection.
    }
  };
  //This function:
  //Connects to the socket server
  //Handles events like joining/leaving the call.Manages peer-to-peer WebRTC connections for real-time video streaming
  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    //Connects the client to the server using Socket.IO

    socketRef.current.on("signal", gotMessageFromServer); //Listens for "signal" messages — typically ICE candidates or SDP offers/answers — sent by peers.

    socketRef.current.on("connect", () => {
      //Once connected to the socket server, run this setup:
      socketRef.current.emit("join-call", window.location.href); //Sends a "join-call" event to the server with the window.location.href(current page URL,localhost....)
      socketIdRef.current = socketRef.current.id; //Stores the unique socket ID of this client.

      socketRef.current.on("chat-message", addMessage); //Handles incoming chat messages.

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        //clients is the full list of connected peers.
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          ); //Creates a new RTCPeerConnection for every connected peer. Stores each connection in the connections object.

          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          }; //client ko other client ke sath join karne keliye

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);

            //bar bar stream change hoga matlab kabhi audio mute ho gaya ye kabhi video ban kar diya but agar video on he hai to yo wala use karo(stream ki jo seej hai wo change kardo)

            //so hamlog setVideos kardenge but jab phirse check karne jayenge tab videos ke andaar nahi hoga kyuki setVideos async hai arr hamlog useEffect use karnahi sakte kyuki hamlog onAddStream mai he karna chahte hai so use videoRef
            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            ); // agar video already hai

            if (videoExists) {
              console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream } //naya stream lake dedo
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Create a new video
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            //If window.localStream exists (the camera + mic you acquired earlier in getPermissions()), just addStream(window.localStream) so they see you.
            // If window.localStream is missing (rare, but say you never got permissions), you create a “black + silence” dummy stream so the connection isn’t totally empty. Then you addStream(...) that dummy.
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue; //if id mere socketId ke equal hai tab continue (khudki connection mei khudki video add)

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {
              console.log(e);
            }

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription }) //sdp->session description
                  );
                })
                //“New user joins → server tells everyone else → others create an “answerer” peer connection.”

                //“But the new user needs to create an offer for each existing peer.”

                //So here, since id === your own ID, you know you are the new user. Now, for each existing connection, you call createOffer() (you become the “offerer”). You send your SDP offer via Socket.IO (“signal”), the remote peer picks it up in their own gotMessageFromServer(), calls setRemoteDescription(), creates an answer, and sends it back in another “signal” event. That completes the SDP handshake.
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  //This function creates a fake audio track that produces no sound (i.e. silence). It’s useful when a user turns off their microphone but you still need to send an audio track to keep the connection stable.

  let silence = () => {
    let ctx = new AudioContext(); //Think of it like a virtual studio for processing and generating audio.
    let oscillator = ctx.createOscillator(); //An oscillator generates a constant tone (waveform) — like a sine wave.
    let dst = oscillator.connect(ctx.createMediaStreamDestination()); //Create a destination (output stream). we connect the oscillator to this stream, so its output (a sound wave) gets piped into a fake mic stream.
    oscillator.start(); //Starts producing the audio signal (even though we’ll soon disable it).
    ctx.resume();
    //In some browsers (especially Chrome), audio contexts start in a "suspended" state due to autoplay policies.
    //resume() explicitly activates it.
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false }); // Get the audio track and mute it. This is the trick: it sends a silent track that keeps the WebRTC connection alive without real audio.
  };

  //creates a blank black video track. You still want to maintain a video stream in the WebRTC connection to avoid disconnections or UI issues.
  let black = ({ width = 640, height = 480 } = {}) => {
    //If no values are provided, it defaults to 640x480 pixels — a standard webcam resolution.
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height); //Dynamically creates an HTML <canvas> element.
    // Why canvas?Because canvas.captureStream() lets us simulate a video feed
    let stream = canvas.captureStream(); //This turns the canvas’s visual content (a black rectangle) into a MediaStream — just like a webcam stream.
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    //Extracts the first (and only) video track from the captured stream.
    //Uses Object.assign to mark the track as enabled: false, meaning:It won’t consume much CPU/bandwidth.It still exists and helps keep the peer connection alive.
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
    // getUserMedia();
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };
  let routeTo = useNavigate();

  let handleEndCall = () => {
    try {
      // 1. Stop all media tracks (video/audio)
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
        window.localStream = null;
      }

      // 2. Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // 3. Clear video refs and peer connections
      videoRef.current = [];
      setVideos([]);
      for (let id in connections) {
        connections[id].close?.();
      }
      connections = {};

      // 4. Clear local video display
      if (localVideoref.current) {
        localVideoref.current.srcObject = null;
      }
    } catch (e) {
      console.log(e);
    }

    routeTo("/home");
  };

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername === true ? (
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyCard}>
            <h2 className={styles.lobbyTitle}>Enter the Lobby</h2>
            <div className={styles.lobbyForm}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                fullWidth
              />
              <Button
                variant="contained"
                className={styles.connectButton}
                onClick={connect}
                fullWidth
              >
                Connect
              </Button>
            </div>
            <div className={styles.videoPreview}>
              <video
                ref={localVideoref}
                autoPlay
                muted
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                  <h1>Chat</h1>
                <IconButton className={styles.closeBtn} size="medium" onClick={() => setModal(false)}>
                  <CloseIcon fontSize="medium" />
                </IconButton>
                </div>
                
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      console.log(messages);
                      return (
                        <div style={{ marginBottom: "20px" }} key={index}>
                          <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={handleMessage}
                    id="outlined-basic"
                    label="Type a message"
                    variant="outlined"
                    fullWidth
                    size="small"
                    className={styles.chatInput}
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    className={styles.sendBtn}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} className={styles.videoBtn}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall}>
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={handleAudio} className={styles.audioBtn}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton onClick={handleScreen} className={styles.screenBtn}>
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} max={999} color="primary">
              <IconButton
                onClick={() => {
                  if (showModal === true) {
                    closeChat();
                  } else {
                    openChat();
                  }
                }}
                className={styles.chatBtn}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video
            className={video ? styles.meetUserVideo : styles.meetUserVideoNone}
            ref={localVideoref}
            autoPlay
            muted
          ></video>

          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId} className={styles.participant}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => ref && (ref.srcObject = video.stream)}
                  autoPlay={video.autoplay}
                  playsInline={video.playsinline}
                />
                <p className={styles.username}>Guest</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
