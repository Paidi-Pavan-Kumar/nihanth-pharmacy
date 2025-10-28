import express from 'express';
import { 
    createBlog, 
    getAllBlogs, 
    getAllBlogsAdmin, 
    getBlogById, 
    updateBlog, 
    deleteBlog 
} from '../controllers/blogController.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from "../middleware/multer.js";

const blogRouter = express.Router();

// Public routes
blogRouter.get('/list', getAllBlogs);
blogRouter.get('/:id', getBlogById);

// Admin only routes
blogRouter.post('/create', adminAuth, createBlog);
blogRouter.get('/admin/list', adminAuth, getAllBlogsAdmin);
blogRouter.put('/update/:id', adminAuth, updateBlog);
blogRouter.delete('/delete/:id', adminAuth, deleteBlog);

export default blogRouter;
