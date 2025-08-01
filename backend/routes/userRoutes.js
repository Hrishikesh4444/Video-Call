import { Router } from "express";
import { loginUser, registerUser ,addToHistory,getUserHistory } from "../controllers/userControllers.js";

const router=Router();

router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)



export default router;