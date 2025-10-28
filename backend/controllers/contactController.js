import contactModel from "../models/contactModel.js";

// Submit a new contact form
const submitContact = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !message) {
            return res.json({ success: false, message: "All fields are required" });
        }

        // Create new contact entry
        const contactData = {
            name,
            email,
            phone,
            message,
            status: "Unread",
            date: Date.now()
        };

        const contact = new contactModel(contactData);
        await contact.save();

        res.json({ success: true, message: "Your message has been sent successfully!" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all contact submissions (for admin)
const getContacts = async (req, res) => {
    try {
        const contacts = await contactModel.find({}).sort({ date: -1 });
        res.json({ success: true, contacts });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update contact status (for admin)
const updateContactStatus = async (req, res) => {
    try {
        const { contactId, status } = req.body;
        
        if (!contactId || !status) {
            return res.json({ success: false, message: "Contact ID and status are required" });
        }

        // Validate status
        if (!["Unread", "Read", "Responded"].includes(status)) {
            return res.json({ success: false, message: "Invalid status" });
        }

        await contactModel.findByIdAndUpdate(contactId, { status });
        res.json({ success: true, message: "Contact status updated successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete a contact (for admin)
const deleteContact = async (req, res) => {
    try {
        const { contactId } = req.body;
        
        if (!contactId) {
            return res.json({ success: false, message: "Contact ID is required" });
        }

        await contactModel.findByIdAndDelete(contactId);
        res.json({ success: true, message: "Contact deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { submitContact, getContacts, updateContactStatus, deleteContact }; 