import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "Unread", enum: ["Unread", "Read", "Responded"] },
    date: { type: Date, default: Date.now }
});

const contactModel = mongoose.models.contact || mongoose.model("contact", contactSchema);

export default contactModel; 