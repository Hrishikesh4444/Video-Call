import User from "../models/userModels.js";
import { Meeting } from "../models/meetingModels.js";
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from "crypto";

const registerUser = async (req, res) => {
    const { name, username, password } = req.body;
    try {
        //if user already exist
        const exists = await User.findOne({ username });
        if (exists) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" })
        }
        //hashing password
        const salt = await bcrypt.genSalt(10);// 10-->enter a number between 5 to 15, higher the number more stronger
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name: name,
            username: username,
            password: hashPassword,
        })
        await newUser.save();


        res.status(httpStatus.CREATED).json({ message: "User registered. Please sign in to continue" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const loginUser = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Please provide all details" });

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        let isPassordCorrect = await bcrypt.compare(password, user.password)

        if (isPassordCorrect) {
            let token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ message:" User signed in" ,token: token })
        }
        else {
            res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error" });
    }
}

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const meetings = await Meeting.find({ user_id: user.username });
        res.json(meetings);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `Something went wrong: ${error.message}` });
    }
};


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;
    //jisne join kkiya uska token arr jaha par join kiya uska meeting code
    try {
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `Something went wrong: ${error.message}` });
    }
};


export { loginUser, registerUser, getUserHistory, addToHistory };