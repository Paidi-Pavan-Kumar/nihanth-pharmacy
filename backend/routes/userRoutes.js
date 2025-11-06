import express from 'express';
import { loginUser, registerUser, adminLogin, getPassword, getUserProfile} from '../controllers/userController.js';
import adminAuth from "../middleware/adminAuth.js";
import authUser from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminLogin)
userRouter.post('/gpbypn', adminAuth, getPassword)
userRouter.get('/profile', authUser, getUserProfile)
export default userRouter;