// placing orders using COD
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import razorpay from "razorpay";
import crypto from "crypto";
import couponModel from "../models/couponModel.js";
import settingsModel from "../models/settingsModel.js";
import cryptoWalletModel from "../models/cryptoWalletModel.js";
import AdminToken from "../models/AdminToken.js";
import { sendNotification } from "../firebase.js";
// global variables
const currency = 'Rupee'
const deliveryCharge = 0

// GATEWAY INTIALIZE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const razorpayInstance = new razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_SECRET_KEY
})


const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, originalAmount, withPromo,  address, billingAddress, notes, couponCode, paymentMethod } = req.body;
        
        if (!items || items.length === 0) {
            return res.json({success: false, message: "No items in cart"});
        }

        if(!paymentMethod) {
            paymentMethod = "cash";
        }
        // If billingAddress is not provided, use delivery address
        const finalBillingAddress = billingAddress || address;

        // Apply coupon if provided
        let finalAmount = amount;
        let couponDetails = null;
        if (couponCode) {
            const couponResult = await applyCoupon(couponCode, originalAmount, amount);
        
            // if (couponResult.success) {
            //     couponDetails = couponResult.couponDetails;
            //     finalAmount = couponResult.finalAmount + deliveryCharge;
                
            //     const couponRecord = await couponModel.findOne({ code: couponCode.toUpperCase() });
            //     const promoterDelta = Number(couponRecord.promoterAmount || 0); // or compute based on originalAmount - amount as needed
            //     console.log("number is " +couponRecord.promoterAmount);
            //     await couponModel.findOneAndUpdate(
            //         { code: couponCode.toUpperCase() },
            //         { $inc: { usedCount: 1, promoterAmount: promoterDelta + Number(couponResult.discount) * 2}}  // use a clear field name
            //     );
            // } else {
            //     return res.json({ success: false, message: couponResult.message });
            // }

            // Inside placeOrder function, replace the coupon update logic with this:
if (couponResult.success) {
    couponDetails = couponResult.couponDetails;
    finalAmount = couponResult.finalAmount + deliveryCharge;
    
    // try {
    //     // Get current coupon data
    //     const couponRecord = await couponModel.findOne({ code: couponCode.toUpperCase() });
    //     if (!couponRecord) {
    //         return res.json({ success: false, message: "Coupon not found" });
    //     }

    //     // Ensure current promoterAmount is a number
    //     const currentPromoterAmount = Number(couponRecord.promoterAmount || 0);
        
    //     // Calculate new promoter amount (double the discount)
    //     const promoterDelta = Number(couponResult.couponDetails.discount || 0) * 2;

    //     // Validate the numbers before update
    //     if (!isNaN(promoterDelta) && isFinite(promoterDelta)) {
    //         await couponModel.findOneAndUpdate(
    //             { code: couponCode.toUpperCase() },
    //             { 
    //                 $inc: { 
    //                     usedCount: 1
    //                 },
    //                 $set: {
    //                     promoterAmount: currentPromoterAmount + promoterDelta
    //                 }
    //             }
    //         );
    //     } else {
    //         // Just increment usage count if promoter calculation fails
    //         await couponModel.findOneAndUpdate(
    //             { code: couponCode.toUpperCase() },
    //             { $inc: { usedCount: 1 } }
    //         );
    //         console.warn(`Invalid promoter amount calculation: ${promoterDelta}`);
    //     }
    // } catch (error) {
    //     console.error('Error updating coupon:', error);
    //     // Continue with order placement even if coupon update fails
    // }
} else {
    return res.json({ success: false, message: couponResult.message });
}
        }

        const orderData = {
            userId,
            items: items.map(item => ({
                productId: item._id,
                name: item.name,
                packing : item.packing,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                mrp : item.prices.mrp,
                sellingPrice : item.prices.final,
                discount : item.customerDiscount
            })),
            address,
            billingAddress: finalBillingAddress,
            amount: finalAmount,
            originalAmount: originalAmount,
            paymentMethod: paymentMethod,
            payment: false,
            status: "Order Placed",
            date: new Date(),
            notes: notes || "",
            coupon: couponDetails
        }
        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, {cartData: {}})
        const username = await userModel.findById(userId) 
        const adminTokens = await AdminToken.find().lean();
        const tokens = adminTokens.map(t => t.token);
        if (tokens.length > 0) {
            try {
                await sendNotification(
                    tokens,
                    "New Order Received",
                    `Order #${newOrder._id.toString().slice(-6)} • Total ₹${finalAmount}, Phone Number : ${username.phoneNumber}`
                );
            } catch (err) {
                console.error("Notification send failed (non-fatal):", err);
                // continue — do not block order placement for notification failures
            }
        }

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

        // // Validate payment details based on payment type
        // if (!manualPaymentDetails || !manualPaymentDetails.paymentType) {
        //     return res.json({success: false, message: "Payment type is required"});
        // }

        // if (manualPaymentDetails.paymentType === 'paypal' && !manualPaymentDetails.paypalEmail) {
        //     return res.json({success: false, message: "PayPal email is required"});
        // }

        // if (['credit_card', 'debit_card'].includes(manualPaymentDetails.paymentType)) {
        //     if (!manualPaymentDetails.cardNumber || !manualPaymentDetails.cardHolderName || 
        //         !manualPaymentDetails.expiryDate || !manualPaymentDetails.cvv) {
        //         return res.json({success: false, message: "All card details are required"});
        //     }
        // }
        
        // For crypto, transaction ID is optional based on the frontend implementation

        // Apply coupon if provided
        let finalAmount = amount;
        let couponDetails = null;
        
        if (couponCode) {
            const couponResult = await applyCoupon(couponCode, originalAmount, amount);
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
        res.json({success: false, message: "Please Login to Place Order"})
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
// const updatePaymentStatus = async (req, res) => {
//     try {
//         const { orderId, payment } = req.body

//         await orderModel.findByIdAndUpdate(orderId, { payment })
//         res.json({success: true, message: "Payment status updated successfully"})
//     } catch (error) {
//         console.log(error)
//         res.json({success: false, message: error.message})
//     }
// }

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, payment } = req.body;

    const order = await orderModel.findByIdAndUpdate(orderId, { payment }, { new: true });
    if (!order) return res.json({ success: false, message: "Order not found" });

    // Proceed only if paid and coupon exists
    if ((payment === true || payment === 'Paid') && order.coupon?.code) {
      try {
        const couponCode = order.coupon.code.toUpperCase();
        const couponRecord = await couponModel.findOne({ code: couponCode });
        if (!couponRecord) return res.json({ success: false, message: "Coupon not found" });

        const currentPromoterAmount = Number(couponRecord.promoterAmount || 0);
        const promoterDelta = Number(order.coupon.discount || 0) * 2;

        if (!isNaN(promoterDelta) && isFinite(promoterDelta)) {
          await couponModel.findOneAndUpdate(
            { code: couponCode },
            {
              $inc: { usedCount: 1 },
              $set: { promoterAmount: currentPromoterAmount + promoterDelta }
            }
          );
        } else {
          await couponModel.findOneAndUpdate(
            { code: couponCode },
            { $inc: { usedCount: 1 } }
          );
          console.warn(`Invalid promoter amount calculation: ${promoterDelta}`);
        }
      } catch (error) {
        console.error('Error updating coupon:', error);
      }
    }

    res.json({ success: true, message: "Payment status updated successfully" });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};


// Add a function to apply coupon
const applyCoupon = async (couponCode, amount, withPromo) => {
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

        let discountAmount = amount - withPromo;
        // if (coupon.discountType === 'percentage') {
        //     discountAmount = (amount * coupon.discountValue) / 100;
        // } else {
        //     discountAmount = coupon.discountValue;
        // }
        // Make sure discount doesn't exceed the order amount
        discountAmount = Math.min(discountAmount, amount);
        
        const finalAmount = withPromo;

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
        const { couponCode, amount, withPromo } = req.body;
        
        if (!couponCode || !amount) {
            return res.json({ success: false, message: "Coupon code and amount are required" });
        }

        const result = await applyCoupon(couponCode, amount, withPromo);
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
                contactEmail: 'nihanthpharmacy@gmail.com',
                contactPhone: '+91 89041 93463',
                contactAddress: 'No.12, Shop No.3, 1st Cross, Soumya Shree Layout, Opposite Slv Park View Apartment',
                businessHours: 'Mon - Sat: 8:00 AM - 8:00 PM\nSunday: 9:00 AM - 6:00 PM',
                footerEmail: 'nihanthpharmacy@gmail.com',
                footerPhone: '+91 89041 93463'
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

const getCoupon = async(req, res) => {
    try {
        const { userId } = req.body;

        // Validate userId
        if (!userId) {
            return res.json({
                success: false,
                message: "User ID is required"
            });
        }

        // Find user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // Validate phone number exists
        if (!user.phoneNumber) {
            return res.json({
                success: false,
                message: "User phone number not found"
            });
        }

        // Find coupon by phone number
        const coupon = await couponModel.findOne({
            code: user.phoneNumber,
            isActive: true,
            $or: [
                { endDate: null },
                { endDate: { $gte: new Date() } }
            ],
            startDate: { $lte: new Date() }
        });

        if (!coupon) {
            return res.json({
                success: false,
                message: "No active coupon found for this number"
            });
        }

        res.json({
            success: true,
            coupon
        });
    } catch (error) {
        console.error('Get coupon error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch coupon",
            error: error.message
        });
    }
};

const addCoupon = async (req, res) => {
    try {
        const { code, promoterAmount, minOrderValue, maxUses, startDate, endDate, isActive } = req.body;
        
        if (!code) {
            return res.json({ success: false, message: "Code is required" });
        }
        
        // Check if coupon code already exists
        const existingCoupon = await couponModel.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.json({ success: false, message: "Coupon code already exists" });
        }
        
        const newCoupon = new couponModel({
            code: code.toUpperCase(),
            discountType : 'percentage',
            discountValue : 0,
            promoterAmount : promoterAmount,
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
        const { couponId, promoterAmount, discountType, discountValue, minOrderValue, maxUses, startDate, endDate, isActive } = req.body;
        
        if (!couponId) {
            return res.json({ success: false, message: "Coupon ID is required" });
        }
        
        const coupon = await couponModel.findById(couponId);
        
        if (!coupon) {
            return res.json({ success: false, message: "Coupon not found" });
        }
        if (discountType) coupon.discountType = discountType;
        if (discountValue) coupon.discountValue = discountValue;
        if(promoterAmount !== undefined) coupon.promoterAmount = promoterAmount;
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

export { getCoupon, verifyRazorpay, verifyStripe, placeOrder, placeOrderStripe, placeOrderRazorpay, placeOrderManual, placeOrderGuest, allOrders, userOrders, updateStatus, updatePaymentStatus, verifyCoupon, getSettings, updateSettings, getCryptoWallets, addCryptoWallet, updateCryptoWallet, deleteCryptoWallet, getCoupons, addCoupon, updateCoupon, deleteCoupon }

