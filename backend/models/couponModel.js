import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true 
    },
    discountType: { 
        type: String, 
        required: true,
        enum: ['percentage', 'fixed'] 
    },
    discountValue: { 
        type: Number, 
        required: true 
    },
    minOrderValue: { 
        type: Number, 
        default: 0 
    },
    maxUses: { 
        type: Number, 
        default: null 
    },
    usedCount: { 
        type: Number, 
        default: 0 
    },
    startDate: { 
        type: Date, 
        default: Date.now 
    },
    endDate: { 
        type: Date, 
        default: null 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const couponModel = mongoose.models.coupon || mongoose.model('coupon', couponSchema);
export default couponModel;
