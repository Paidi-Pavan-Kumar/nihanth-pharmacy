import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import upload from "../middleware/multer.js";
import {
uploadImage
} from '../controllers/uploadImage.js'

const uploadImageRoute = express.Router()

uploadImageRoute.post('/add', adminAuth, upload.fields([{name:'image', maxCount:1}]), uploadImage);

export default uploadImageRoute