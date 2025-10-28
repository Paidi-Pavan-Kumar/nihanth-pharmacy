import blogModel from "../models/blogModel.js";

// Create a new blog post (admin only)
const createBlog = async (req, res) => {
    try {
        const { title, image, content, author } = req.body;

        if (!title || !image || !content || !author) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const newBlog = new blogModel({
            title,
            image,
            content,
            author,
            isPublished: true
        });

        const savedBlog = await newBlog.save();
        
        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            blog: savedBlog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all blogs (with pagination)
const getAllBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const blogs = await blogModel.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const totalBlogs = await blogModel.countDocuments({ isPublished: true });
        
        res.status(200).json({
            success: true,
            blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBlogs / limit),
                totalBlogs
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all blogs for admin (including unpublished)
const getAllBlogsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const blogs = await blogModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const totalBlogs = await blogModel.countDocuments();
        
        res.status(200).json({
            success: true,
            blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBlogs / limit),
                totalBlogs
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get a specific blog by ID
const getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const blog = await blogModel.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }
        
        res.status(200).json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update a blog post (admin only)
const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, image, content, author, isPublished } = req.body;
        
        const blog = await blogModel.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }
        
        const updatedBlog = await blogModel.findByIdAndUpdate(
            id,
            {
                title: title || blog.title,
                image: image || blog.image,
                content: content || blog.content,
                author: author || blog.author,
                isPublished: isPublished !== undefined ? isPublished : blog.isPublished,
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            blog: updatedBlog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete a blog post (admin only)
const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        
        const blog = await blogModel.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }
        
        await blogModel.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Blog deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export { createBlog, getAllBlogs, getAllBlogsAdmin, getBlogById, updateBlog, deleteBlog };
