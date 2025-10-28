import validator from "validator";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from '../models/userModel.js';


const createToken=(id) => {
    return jwt.sign({id}, process.env.JWT_SECRET)
}



// route for user login
const loginUser = async (req, res) => {
    try {
        
        const {email, password} = req.body;

        const user = await userModel.findOne({email});

        if (!user) {
            return res.json({success:false, message:"User Not Exists"})
        }

        const isMatch = await bycrypt.compare(password, user.password)

        if (isMatch) {
            const token = createToken(user._id)
            res.json({success:true, token})
        }
        else{
            res.json({success:false, message: 'Invalid Credits'})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false, message:error.message})

    }
}

// route for user regsiter

const registerUser = async (req, res) => {

    try {
        const {name, email, password} = req.body;

        // checking user alredy exists or not
        const exists = await userModel.findOne({email});
        if (exists) {
            return res.json({success:false, message:"User Already Exists"})
        }
        // validating email formad and strong password
        if (!validator.isEmail(email)) {
            return res.json({success:false, message:"please enter a valid email"})
        }
        if (password.length < 8) {
            return res.json({success:false, message:"please enter a 8 character password"})
        }

        //hashing user password
        const salt = await bycrypt.genSalt(10)
        const hashedPassword = await bycrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password:hashedPassword,
        })

        const user = await newUser.save()
        const token = createToken(user._id)

        res.json({success:true, token})


    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
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