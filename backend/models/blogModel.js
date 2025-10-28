import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const blogModel = mongoose.models.blog || mongoose.model('blog', blogSchema);

export default blogModel;
