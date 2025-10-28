import { response } from "express";
import userModel from "../models/userModel.js"

// add products to user cart
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, cartData } = req.body

        const userData = await userModel.findById(userId)
        let userCartData = userData.cartData || {};

        // Save the complete cart data object for this item
        userCartData[itemId] = cartData;

        await userModel.findByIdAndUpdate(userId, { cartData: userCartData })

        res.json({ success: true, message: "Added To Cart"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// update user cart
const updateCart = async (req, res) => {
    try {
        const { userId, itemId, cartData } = req.body

        const userData = await userModel.findById(userId)
        let userCartData = userData.cartData || {};

        // If cartData has quantity set to 0, remove the item from cart
        if (cartData.quantity === 0) {
            delete userCartData[itemId];
        } else {
            // Otherwise update with the complete cart data object
            userCartData[itemId] = cartData;
        }

        await userModel.findByIdAndUpdate(userId, { cartData: userCartData })

        res.json({ success: true, message: "Cart Updated"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// get user cart data
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body

        const userData = await userModel.findById(userId)
        let cartData = userData.cartData || {};

        res.json({ success: true, cartData });
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { addToCart, updateCart, getUserCart }