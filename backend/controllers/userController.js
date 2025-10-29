import validator from "validator";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from '../models/userModel.js';

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

        const isMatch = await bycrypt.compare(password, user.password)

        if (isMatch) {
            const token = createToken(user._id)
            res.json({success: true, token})
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
        if (password.length < 8) {
            return res.json({
                success: false, 
                message: "Password must be at least 8 characters long"
            });
        }

        // Hash password
        const salt = await bycrypt.genSalt(10)
        const hashedPassword = await bycrypt.hash(password, salt)

        // Create new user
        const newUser = new userModel({
            phoneNumber,
            name,
            email,
            password: hashedPassword,
        })

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
        res.json({success:false, message:error.message})
    }
}

export { loginUser, registerUser, adminLogin}