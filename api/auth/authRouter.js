import { Router } from "express";

import { mentorAuthMiddleware } from "../middleware/mentorAuthMiddleware.js";

import {
	handleLogin,
	handleRegister,
	getMentorDetails,
} from "./authController.js";

const router = Router();

router.post("/login", handleLogin);
router.post("/register", handleRegister);
router.get("/mentor", mentorAuthMiddleware, getMentorDetails);

export default router;
