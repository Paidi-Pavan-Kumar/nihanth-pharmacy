import express from 'express'
const router = express.Router();
import authUser from '../middleware/auth.js';
import {uploadPrescription, getPrescriptions} from '../controllers/uploadPrescriptionController.js';
import upload from "../middleware/multer.js";

// Public route for uploading prescriptions (both guest and authenticated users)
// router.post('/upload', uploadPrescription);

router.post('/upload', upload.fields([{name:'image1', maxCount:1}, 
    {name:'image2', maxCount:1}, 
    {name:'image3', maxCount:1}, 
    {name:'image4', maxCount:1}]),uploadPrescription);

// Protected route for getting user's prescriptions
router.get('/my-prescriptions', authUser, getPrescriptions);

export default router;
