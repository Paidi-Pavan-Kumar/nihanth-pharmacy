import mongoose from "mongoose";

const cryptoWalletSchema = new mongoose.Schema({
    cryptoType: { 
        type: String, 
        required: true,
        enum: ['BTC', 'USDT'] 
    },
    network: { 
        type: String, 
        required: true 
    },
    walletAddress: { 
        type: String, 
        required: true 
    },
    qrCodeImage: { 
        type: String, 
        required: true 
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

const cryptoWalletModel = mongoose.models.cryptoWallet || mongoose.model('cryptoWallet', cryptoWalletSchema);
export default cryptoWalletModel; 