import validator from "validator";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from '../models/userModel.js';
import couponModel from "../models/couponModel.js";
const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET)
}

// route for user login
const loginUser = async (req, res) => {
    try {
        const {phoneNumber, password} = req.body;

        // Validate phone number
        if (!phoneNumber || phoneNumber.length !== 10) {
            return res.json({
                success: false, 
                message: "Please enter a valid 10-digit phone number"
            });
        }

        const user = await userModel.findOne({phoneNumber});

        if (!user) {
            return res.json({
                success: false, 
                message: "User does not exist"
            });
        }

        const isMatch = password === user.password
        if (isMatch) {
            const token = createToken(user._id)
            res.json({success: true, token, user})
        } else {
            res.json({
                success: false, 
                message: 'Invalid credentials'
            })
        }
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// route for user register
const registerUser = async (req, res) => {
    try {
        const {phoneNumber, name, email, password} = req.body;

        // Validate phone number
        if (!phoneNumber || phoneNumber.length !== 10) {
            return res.json({
                success: false, 
                message: "Please enter a valid 10-digit phone number"
            });
        }

        // Check if user exists by phone number
        const exists = await userModel.findOne({phoneNumber});
        if (exists) {
            return res.json({
                success: false, 
                message: "Phone number already registered"
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({
                success: false, 
                message: "Please enter a valid email"
            });
        }

        // Validate password
        if (password.length < 5) {
            return res.json({
                success: false, 
                message: "Password must be at least 5 characters long"
            });
        }

        // Create new user
        const newUser = new userModel({
            phoneNumber,
            name,
            email,
            password,
        })

        const newCoupon = new couponModel({
            code : phoneNumber
        })

        const isSuccess = await newCoupon.save()

        const user = await newUser.save()
        const token = createToken(user._id)

        res.json({success: true, token})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// route for admin login
const adminLogin = async (req, res) => {
    try {
        const {email, password} = req.body
        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign(email+password, process.env.JWT_SECRET);
            res.json({success:true, token})
        }
        else{
            res.json({success:false, message:"invalid credits"})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"don't know"})
    }
}

const getPassword = async(req,res)=>{
    try {
        const {phoneNumber} = req.body;
        const user = await userModel.findOne({phoneNumber});
        if(!user){
            return res.json({success:false,message:'User Not Found'})
        }
        res.json({success:true,password:user.password})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const getUserProfile = async (req, res) => {
    try {
        const {userId} = req.body
        const user = await userModel.findById(userId).select('-password');
        
        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                savedAddresses : user.savedAddresses,
                isPromoter: user.isPromoter
            }
        });
    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            message: 'Error fetching user profile'
        });
    }
};

// add update profile handler
const updateUserProfile = async (req, res) => {
  try {
    const { userId, name, email, phoneNumber, savedAddresses } = req.body;
    if (!userId) return res.json({ success: false, message: "userId required" });

    // basic validation
    if (phoneNumber && String(phoneNumber).length !== 10) {
      return res.json({ success: false, message: "Please enter a valid 10-digit phone number" });
    }
    if (email && !validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    // check for duplicates
    if (phoneNumber) {
      const existsPhone = await userModel.findOne({ phoneNumber, _id: { $ne: userId } });
      if (existsPhone) return res.json({ success: false, message: "Phone number already in use" });
    }
    if (email) {
      const existsEmail = await userModel.findOne({ email, _id: { $ne: userId } });
      if (existsEmail) return res.json({ success: false, message: "Email already in use" });
    }

    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phoneNumber !== undefined) update.phoneNumber = phoneNumber;
    if (savedAddresses !== undefined) update.savedAddresses = savedAddresses;

    const user = await userModel.findByIdAndUpdate(userId, update, { new: true }).select('-password');

    if (!user) return res.json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    console.error("updateUserProfile error:", error);
    res.json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, adminLogin, getPassword, getUserProfile, updateUserProfile}