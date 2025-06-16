
import { Server } from "socket.io"

let connections={};  //An object (map) where each key is a “room” (called path in this code) and the corresponding value is an array of active Socket IDs in that room.
let messages={};     //An object that stores chat history for each room. Each key is the room name (same path), and the value is an array of message‐objects (each object holds { sender, data, "socket-id-sender" }).
let timeOnline={};   //Maps each socket’s id to a JavaScript Date representing when that socket first joined a room. This can be used to calculate how long a user stayed online when they disconnect.


const connectToSocket=(server)=>{
    const io=new Server(server,{
        cors:{
            origin: "*",
            methods: ["GET","POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });


    io.on("connection",(socket)=>{ //This sets up the “connection” listener, which fires each time a new client establishes a Socket.IO connection.

        console.log("User connected")
        socket.on("join-call",(path)=>{
            //"user-joined" is emitted whenever a new peer joins the room (sent to every socket in that room, including the newcomer).
            if(connections[path]===undefined){
                connections[path]=[]
            }
            connections[path].push(socket.id);
            timeOnline[socket.id]=new Date();


            for(let i=0;i<connections[path].length;i++){
                io.to(connections[path][i]).emit("user-joined",socket.id,connections[path]);
            }


            if(messages[path] !== undefined){
                for(let i=0;i<messages[path].length;i++){
                    io.to(socket.id).emit("chat-message",messages[path][i]['data'],messages[path][i]['sender'],messages[path][i]['socket-id-sender']);
                }
            }
        })

        //It's typically used in WebRTC or peer-to-peer (P2P) applications for things like:Sending connection offers, Sending answers, Sharing ICE candidates
        // Essentially, it's part of the process that helps two peers establish a direct connection via WebRTC.

        //toId: the socket ID of the target peer they want to send signaling data to.
        //message: the signaling data (like SDP offer/answer, ICE candidate, etc.).
        socket.on("signal",(toId,message)=>{
            io.to(toId).emit("signal",socket.id,message);
        })
 
        socket.on("chat-message",(data,sender)=>{
            //"chat-message" is broadcast to all sockets in the same room, along with a server‐side store of message history.
            const [matchingRoom,found]=Object.entries(connections).reduce(([room,isFound],[roomKey,roomValue])=>{
                if(!isFound && roomValue.includes(socket.id)){
                    return [roomKey,true];
                }
            },['',false]);

            if(found===true){
                if(messages[matchingRoom]===undefined){
                    messages[matchingRoom]=[];
                }
                messages[matchingRoom].push({'sender':sender, "data": data, "socket-id-sender":socket.id});

                connections[matchingRoom].forEach(element => {
                    io.to(element).emit("chat-message",data,sender,socket.id)
                });
            }
        })

        socket.on("disconnect",()=>{
            let diffTime=Math.abs(timeOnline[socket.id]-new Date());

            let key;
            for(const [k,v] of JSON.parse(JSON.stringify(Object.entries(connections)))){
                //Object.entries(connections) gives you references to the actual arrays inside connections. 
                // If you start modifying connections[k] while iterating, you can run into unexpected behavior.
                //  By doing JSON.parse(JSON.stringify(...)), you create a deep‐copied snapshot of those entries
                //k->room kya hai
                //v->person kya hai
                for(let i=0;i<v.length;i++){
                    if(v[i]===socket.id){
                        let key=k;
                        for(let j=0;j<connections[key].length;j++){
                            io.to(connections[key][j]).emit('user-left',socket.id);
                        }

                        let index=connections[key].indexOf(socket.id);

                        connections[key].splice(index,1);

                        if(connections[key].length===0){
                            delete connections[key];
                        }
                    }
                }
            }
        })
    })

    return io;
}


export default connectToSocket;