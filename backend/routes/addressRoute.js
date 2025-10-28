import express from 'express';
import { saveAddress, getAddresses } from '../controllers/addressController.js';
import authUser from '../middleware/auth.js';

const router = express.Router();

router.post('/save', authUser, saveAddress);
router.get('/get', authUser, getAddresses);

export default router; 