import express from "express";
import mongoose from "mongoose";
import { Server } from "socket.io";
import {createServer} from "node:http";
import cors from "cors";
import connectToSocket from "./controllers/socketManager.js"
import userRoutes from "./routes/userRoutes.js";
import 'dotenv/config'

const app=express();
const server=createServer(app);
const io=connectToSocket(server);

app.set("port",(process.env.PORT || 8000))
app.use(cors());
app.use(express.json({limit: "50kb"}));
app.use(express.urlencoded({limit: "50kb", extended: true}));


// app.get("/",(req,res)=>{
//     return res.json({"intro":"hello World"});
// })

app.use("/api/v1/users",userRoutes);


const start=async()=>{

    const connectionDb=await mongoose.connect(`${process.env.MONGODB_URL}`)
        .then(()=>{
            console.log("MongoDb connected");
        })

    server.listen(app.get("port"),()=>{
        console.log("Listening on port 8000");
    })
}

start();
