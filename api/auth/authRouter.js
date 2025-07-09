import { Router } from "express";

import { handleLogin, handleRegister } from "./authController.js";



const router = Router();

router.post("/login", handleLogin)
router.post('/register', handleRegister);

export default router;