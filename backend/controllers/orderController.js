// placing orders using COD
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import razorpay from "razorpay";
import crypto from "crypto";
import couponModel from "../models/couponModel.js";
import settingsModel from "../models/settingsModel.js";
import cryptoWalletModel from "../models/cryptoWalletModel.js";

// global variables
const currency = 'usd'
const deliveryCharge = 35

// GATEWAY INTIALIZE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const razorpayInstance = new razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_SECRET_KEY
})


const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, originalAmount, address, billingAddress, notes, couponCode } = req.body;
        
        if (!items || items.length === 0) {
            return res.json({success: false, message: "No items in cart"});
        }

        // If billingAddress is not provided, use delivery address
        const finalBillingAddress = billingAddress || address;

        // Apply coupon if provided
        let finalAmount = amount;
        let couponDetails = null;
        
        if (couponCode) {
            const couponResult = await applyCoupon(couponCode, originalAmount - deliveryCharge);
            if (couponResult.success) {
                couponDetails = couponResult.couponDetails;
                finalAmount = couponResult.finalAmount + deliveryCharge;
                
                // Increment the coupon usage count
                await couponModel.findOneAndUpdate(
                    { code: couponCode.toUpperCase() },
                    { $inc: { usedCount: 1 } }
                );
            } else {
                return res.json({ success: false, message: couponResult.message });
            }
        }

        const orderData = {
            userId,
            items: items.map(item => ({
                productId: item._id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity
            })),
            address,
            billingAddress: finalBillingAddress,
            amount: finalAmount,
            originalAmount: originalAmount,
            paymentMethod: "COD",
            payment: false,
            status: "Order Placed",
            date: new Date(),
            notes: notes || "",
            coupon: couponDetails
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, {cartData: {}})

        res.json({success: true, message: "Order Placed"})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// placing orders using stripe

const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address, billingAddress } = req.body;
        const { origin } = req.headers

        if (!items || items.length === 0) {
            return res.json({success: false, message: "No items in cart"});
        }

        // If billingAddress is not provided, use delivery address
        const finalBillingAddress = billingAddress || address;

        const orderData = {
            userId,
            items: items.map(item => ({
                productId: item._id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity
            })),
            address,
            billingAddress: finalBillingAddress,
            amount,
            paymentMethod: "Stripe",
            payment: false,
            status: "Order Placed",
            date: new Date()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                    images: [item.image]
                },
                unit_amount: item.price * 100 
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100 
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        res.json({success: true, session_url:session.url})

    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message})
    }
}

// verify stripe
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, {payment:true})
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true});
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message})
    }
}

// placing orders using razor

const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, amount, address, billingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.json({success: false, message: "No items in cart"});
        }

        // If billingAddress is not provided, use delivery address
        const finalBillingAddress = billingAddress || address;

        const orderData = {
            userId,
            items: items.map(item => ({
                productId: item._id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity
            })),
            address,
            billingAddress: finalBillingAddress,
            amount,
            paymentMethod: "Razorpay",
            payment: false,
            status: "Order Placed",
            date: new Date()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const options = {
            amount: amount*100,
            currency: currency.toUpperCase(),
            receipt : newOrder._id.toString()
        }

        await razorpayInstance.orders.create(options, (error, order)=>{
            if (error) {
                console.log(error)
                return res.json({success:false, message:error})
            }
            res.json({success:true, order})
        })

    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message})
    }
}

const verifyRazorpay = async (req, res) => {
    try {
        const { userId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body

        // Verify the payment
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        
        // Create signature verification data
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        // Verify signature
        if (generated_signature === razorpay_signature) {
            if (orderInfo.status === 'paid') {
                await orderModel.findByIdAndUpdate(orderInfo.receipt, {payment: true});
                await userModel.findByIdAndUpdate(userId, {cartData: {}})
                res.json({ success: true, message: "Payment Successful" })
            } else {
                res.json({ success: false, message: "Payment Failed" })
            }
        } else {
            res.json({ success: false, message: "Invalid signature" })
        }
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// placing orders using manual payment
const placeOrderManual = async (req, res) => {
    try {
        const { userId, items, amount, originalAmount, address, billingAddress, manualPaymentDetails, notes, couponCode } = req.body;
        
        if (!items || items.length === 0) {
            return res.json({success: false, message: "No items in cart"});
        }

        // Validate payment details based on payment type
        if (!manualPaymentDetails || !manualPaymentDetails.paymentType) {
            return res.json({success: false, message: "Payment type is required"});
        }

        if (manualPaymentDetails.paymentType === 'paypal' && !manualPaymentDetails.paypalEmail) {
            return res.json({success: false, message: "PayPal email is required"});
        }

        if (['credit_card', 'debit_card'].includes(manualPaymentDetails.paymentType)) {
            if (!manualPaymentDetails.cardNumber || !manualPaymentDetails.cardHolderName || 
                !manualPaymentDetails.expiryDate || !manualPaymentDetails.cvv) {
                return res.json({success: false, message: "All card details are required"});
            }
        }
        
        // For crypto, transaction ID is optional based on the frontend implementation

        // If billingAddress is not provided, use delivery address
        const finalBillingAddress = billingAddress || address;

        // Apply coupon if provided
        let finalAmount = amount;
        let couponDetails = null;
        
        if (couponCode) {
            const couponResult = await applyCoupon(couponCode, originalAmount - deliveryCharge);
            if (couponResult.success) {
                couponDetails = couponResult.couponDetails;
                finalAmount = couponResult.finalAmount + deliveryCharge;
                
                // Increment the coupon usage count
                await couponModel.findOneAndUpdate(
                    { code: couponCode.toUpperCase() },
                    { $inc: { usedCount: 1 } }
                );
            } else {
                return res.json({ success: false, message: couponResult.message });
            }
        }

        const orderData = {
            userId,
            items: items.map(item => ({
                productId: item._id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity
            })),
            address,
            billingAddress: finalBillingAddress,
            amount: finalAmount,
            originalAmount: originalAmount,
            paymentMethod: "Manual",
            payment: false,
            status: "Order Placed",
            date: new Date(),
            notes: notes || "",
            coupon: couponDetails,
            manualPaymentDetails
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, {cartData: {}})

        res.json({success: true, message: "Order placed successfully. Our customer representative will confirm your payment. Thank you for ordering."})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// placing orders using guest checkout (without login)
const placeOrderGuest = async (req, res) => {
    try {
        const { items, amount, originalAmount, address, billingAddress, manualPaymentDetails, notes, couponCode } = req.body;
        
        if (!items || items.length === 0) {
            return res.json({success: false, message: "No items in cart"});
        }

        // Validate payment details based on payment type
        if (!manualPaymentDetails || !manualPaymentDetails.paymentType) {
            return res.json({success: false, message: "Payment type is required"});
        }

        if (manualPaymentDetails.paymentType === 'paypal' && !manualPaymentDetails.paypalEmail) {
            return res.json({success: false, message: "PayPal email is required"});
        }

        if (['credit_card', 'debit_card'].includes(manualPaymentDetails.paymentType)) {
            if (!manualPaymentDetails.cardNumber || !manualPaymentDetails.cardHolderName || 
                !manualPaymentDetails.expiryDate || !manualPaymentDetails.cvv) {
                return res.json({success: false, message: "All card details are required"});
            }
        }
        
        // For crypto, transaction ID is optional based on the frontend implementation

        // Apply coupon if provided
        let finalAmount = amount;
        let couponDetails = null;
        
        if (couponCode) {
            const couponResult = await applyCoupon(couponCode, originalAmount - deliveryCharge);
            if (couponResult.success) {
                couponDetails = couponResult.couponDetails;
                finalAmount = couponResult.finalAmount + deliveryCharge;
                
                // Increment the coupon usage count
                await couponModel.findOneAndUpdate(
                    { code: couponCode.toUpperCase() },
                    { $inc: { usedCount: 1 } }
                );
            } else {
                return res.json({ success: false, message: couponResult.message });
            }
        }

        // If billingAddress is not provided, use delivery address
        const finalBillingAddress = billingAddress || address;

        const orderData = {
            isGuest: true,
            items: items.map(item => ({
                productId: item._id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity
            })),
            address,
            billingAddress: finalBillingAddress,
            amount: finalAmount,
            originalAmount: originalAmount,
            paymentMethod: "Manual",
            payment: false,
            status: "Order Placed",
            date: new Date(),
            notes: notes || "",
            coupon: couponDetails,
            manualPaymentDetails
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        res.json({success: true, message: "Order placed successfully. Our customer representative will confirm your payment. Thank you for ordering."})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// all orders for admin panel

const allOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            startDate,
            endDate,
            email,
            paymentType,
            amount,
            status,
            paymentStatus
        } = req.body;

        // Build filter query
        let query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        if (email) {
            query['address.email'] = { $regex: email, $options: 'i' };
        }

        if (paymentType) {
            query['manualPaymentDetails.paymentType'] = paymentType;
        }

        if (amount) {
            query.amount = parseFloat(amount);
        }

        if (status) {
            query.status = status;
        }

        if (paymentStatus !== undefined && paymentStatus !== '') {
            query.payment = paymentStatus === 'true';
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalOrders = await orderModel.countDocuments(query);

        // Get filtered and paginated orders
        const orders = await orderModel.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            orders,
            pagination: {
                total: totalOrders,
                pages: Math.ceil(totalOrders / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// user orders data for front end

const userOrders = async (req, res) => {
    try {
        const { userId, email, page = 1, limit = 5 } = req.body;
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        let query = {};
        
        // If user is logged in, find by userId
        if (userId) {
            query.userId = userId;
        } 
        // If looking up by email (for non-logged-in users)
        else if (email) {
            query['address.email'] = email;
        } else {
            return res.json({ success: false, message: "User ID or email is required" });
        }
        
        // Get total count for pagination
        const totalOrders = await orderModel.countDocuments(query);
        
        // Get orders with pagination
        const orders = await orderModel.find(query)
            .sort({ date: -1 }) // Latest orders first
            .skip(skip)
            .limit(parseInt(limit));
            
        res.json({
            success: true, 
            orders,
            pagination: {
                total: totalOrders,
                pages: Math.ceil(totalOrders / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

// update order status from admin panel

const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body

        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({success: true, message: "Order status updated successfully"})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// update payment status from admin panel
const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId, payment } = req.body

        await orderModel.findByIdAndUpdate(orderId, { payment })
        res.json({success: true, message: "Payment status updated successfully"})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// Add a function to apply coupon
const applyCoupon = async (couponCode, amount) => {
    try {
        const coupon = await couponModel.findOne({ 
            code: couponCode.toUpperCase(),
            isActive: true,
            $or: [
                { endDate: null },
                { endDate: { $gte: new Date() } }
            ],
            startDate: { $lte: new Date() }
        });

        if (!coupon) {
            return { success: false, message: "Invalid or expired coupon code" };
        }

        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return { success: false, message: "Coupon usage limit reached" };
        }

        if (amount < coupon.minOrderValue) {
            return { 
                success: false, 
                message: `Minimum order value of ${currency} ${coupon.minOrderValue} required for this coupon` 
            };
        }

        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (amount * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        // Make sure discount doesn't exceed the order amount
        discountAmount = Math.min(discountAmount, amount);
        
        const finalAmount = amount - discountAmount;

        return { 
            success: true, 
            couponDetails: {
                code: coupon.code,
                discount: discountAmount,
                discountType: coupon.discountType
            },
            finalAmount 
        };
    } catch (error) {
        console.log(error);
        return { success: false, message: error.message };
    }
}

// Verify coupon endpoint
const verifyCoupon = async (req, res) => {
    try {
        const { couponCode, amount } = req.body;
        
        if (!couponCode || !amount) {
            return res.json({ success: false, message: "Coupon code and amount are required" });
        }

        const result = await applyCoupon(couponCode, amount);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Expose new function to update settings
const getSettings = async (req, res) => {
    try {
        let settings = await settingsModel.findOne();
        
        if (!settings) {
            // Create default settings if none exist
            settings = await settingsModel.create({
                contactEmail: 'ymgspharmacy@gmail.com',
                contactPhone: '+91 8858284423',
                contactAddress: '123 Fresh Market Lane, Garden District, Green City 12345',
                businessHours: 'Mon - Sat: 8:00 AM - 8:00 PM\nSunday: 9:00 AM - 6:00 PM',
                footerEmail: 'ymgspharmacy@gmail.com',
                footerPhone: '+91 8858284423'
            });
        }
        
        res.json({ success: true, settings });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const updateSettings = async (req, res) => {
    try {
        const { contactEmail, contactPhone, contactAddress, businessHours, footerEmail, footerPhone } = req.body;
        
        // Validate required fields
        if (!contactEmail || !contactPhone || !contactAddress || !businessHours || !footerEmail || !footerPhone) {
            return res.json({ success: false, message: "All fields are required" });
        }
        
        let settings = await settingsModel.findOne();
        
        if (!settings) {
            // Create new settings if none exist
            settings = new settingsModel({
                contactEmail,
                contactPhone,
                contactAddress,
                businessHours,
                footerEmail,
                footerPhone
            });
        } else {
            // Update existing settings
            settings.contactEmail = contactEmail;
            settings.contactPhone = contactPhone;
            settings.contactAddress = contactAddress;
            settings.businessHours = businessHours;
            settings.footerEmail = footerEmail;
            settings.footerPhone = footerPhone;
            settings.updatedAt = new Date();
        }
        
        await settings.save();
        
        res.json({ success: true, message: "Settings updated successfully", settings });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Crypto wallet management
const getCryptoWallets = async (req, res) => {
    try {
        const wallets = await cryptoWalletModel.find({ isActive: true });
        res.json({ success: true, wallets });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const addCryptoWallet = async (req, res) => {
    try {
        const { cryptoType, network, walletAddress, qrCodeImage } = req.body;
        
        if (!cryptoType || !network || !walletAddress || !qrCodeImage) {
            return res.json({ success: false, message: "All fields are required" });
        }
        
        const newWallet = new cryptoWalletModel({
            cryptoType,
            network,
            walletAddress,
            qrCodeImage
        });
        
        await newWallet.save();
        
        res.json({ success: true, message: "Crypto wallet added successfully", wallet: newWallet });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const updateCryptoWallet = async (req, res) => {
    try {
        const { walletId, cryptoType, network, walletAddress, qrCodeImage, isActive } = req.body;
        
        if (!walletId) {
            return res.json({ success: false, message: "Wallet ID is required" });
        }
        
        const wallet = await cryptoWalletModel.findById(walletId);
        
        if (!wallet) {
            return res.json({ success: false, message: "Wallet not found" });
        }
        
        if (cryptoType) wallet.cryptoType = cryptoType;
        if (network) wallet.network = network;
        if (walletAddress) wallet.walletAddress = walletAddress;
        if (qrCodeImage) wallet.qrCodeImage = qrCodeImage;
        if (isActive !== undefined) wallet.isActive = isActive;
        
        await wallet.save();
        
        res.json({ success: true, message: "Wallet updated successfully", wallet });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const deleteCryptoWallet = async (req, res) => {
    try {
        const { walletId } = req.body;
        
        if (!walletId) {
            return res.json({ success: false, message: "Wallet ID is required" });
        }
        
        await cryptoWalletModel.findByIdAndDelete(walletId);
        
        res.json({ success: true, message: "Wallet deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Coupon management
const getCoupons = async (req, res) => {
    try {
        const coupons = await couponModel.find().sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const addCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderValue, maxUses, startDate, endDate, isActive } = req.body;
        
        if (!code || !discountType || !discountValue) {
            return res.json({ success: false, message: "Code, discount type and value are required" });
        }
        
        // Check if coupon code already exists
        const existingCoupon = await couponModel.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.json({ success: false, message: "Coupon code already exists" });
        }
        
        const newCoupon = new couponModel({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderValue: minOrderValue || 0,
            maxUses,
            startDate: startDate || new Date(),
            endDate,
            isActive: isActive !== undefined ? isActive : true
        });
        
        await newCoupon.save();
        
        res.json({ success: true, message: "Coupon added successfully", coupon: newCoupon });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const updateCoupon = async (req, res) => {
    try {
        const { couponId, discountType, discountValue, minOrderValue, maxUses, startDate, endDate, isActive } = req.body;
        
        if (!couponId) {
            return res.json({ success: false, message: "Coupon ID is required" });
        }
        
        const coupon = await couponModel.findById(couponId);
        
        if (!coupon) {
            return res.json({ success: false, message: "Coupon not found" });
        }
        
        if (discountType) coupon.discountType = discountType;
        if (discountValue) coupon.discountValue = discountValue;
        if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
        if (maxUses !== undefined) coupon.maxUses = maxUses;
        if (startDate) coupon.startDate = startDate;
        if (endDate) coupon.endDate = endDate;
        if (isActive !== undefined) coupon.isActive = isActive;
        
        await coupon.save();
        
        res.json({ success: true, message: "Coupon updated successfully", coupon });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.body;
        
        if (!couponId) {
            return res.json({ success: false, message: "Coupon ID is required" });
        }
        
        await couponModel.findByIdAndDelete(couponId);
        
        res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { verifyRazorpay, verifyStripe, placeOrder, placeOrderStripe, placeOrderRazorpay, placeOrderManual, placeOrderGuest, allOrders, userOrders, updateStatus, updatePaymentStatus, verifyCoupon, getSettings, updateSettings, getCryptoWallets, addCryptoWallet, updateCryptoWallet, deleteCryptoWallet, getCoupons, addCoupon, updateCoupon, deleteCoupon }

