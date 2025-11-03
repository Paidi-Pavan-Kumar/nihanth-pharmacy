import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    notes: {
        type: String,
        required: false
    },
    prescriptionImages: {
         type: Array, 
         required: true ,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    date: { 
        type: Date, 
        default: Date.now() 
    }
}, {
    timestamps: true
});

const prescriptionModel = mongoose.model('Prescription', prescriptionSchema);
export default prescriptionModel;
