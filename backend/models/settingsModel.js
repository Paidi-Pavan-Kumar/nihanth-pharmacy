import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    contactEmail: { 
        type: String, 
        required: true 
    },
    contactPhone: { 
        type: String, 
        required: true 
    },
    contactAddress: { 
        type: String, 
        required: true 
    },
    businessHours: { 
        type: String, 
        required: true 
    },
    footerEmail: { 
        type: String, 
        required: true 
    },
    footerPhone: { 
        type: String, 
        required: true 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

const settingsModel = mongoose.models.settings || mongoose.model('settings', settingsSchema);
export default settingsModel; 