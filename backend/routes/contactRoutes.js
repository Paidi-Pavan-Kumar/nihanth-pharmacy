import express from 'express';
import { submitContact, getContacts, updateContactStatus, deleteContact } from '../controllers/contactController.js';
import adminAuth from '../middleware/adminAuth.js';

const contactRouter = express.Router();

// Public route for submitting contact forms
contactRouter.post('/submit', submitContact);

// Admin routes for managing contacts
contactRouter.post('/list', adminAuth, getContacts);
contactRouter.post('/update-status', adminAuth, updateContactStatus);
contactRouter.post('/delete', adminAuth, deleteContact);

export default contactRouter; 