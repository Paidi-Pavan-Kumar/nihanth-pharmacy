import express from 'express';
import { loginUser, registerUser, adminLogin, getPassword} from '../controllers/userController.js';
import adminAuth from "../middleware/adminAuth.js";

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminLogin)
userRouter.post('/gpbypn', adminAuth, getPassword)

export default userRouter;