import userModel from "../models/userModel.js";
import { errorHandler } from "../utils/error.js";

export const saveAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const userId = req.body.userId;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Add new address to saved addresses array
        user.savedAddresses.push(address);
        await user.save();

        res.status(200).json({
            success: true,
            addresses: user.savedAddresses
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAddresses = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            addresses: user.savedAddresses || []
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
