import express from 'express'
import { 
    placeOrder, placeOrderStripe, placeOrderRazorpay, placeOrderManual, placeOrderGuest, 
    allOrders, userOrders, updateStatus, updatePaymentStatus, verifyStripe, verifyRazorpay,
    verifyCoupon, getSettings, updateSettings,
    getCryptoWallets, addCryptoWallet, updateCryptoWallet, deleteCryptoWallet,
    getCoupons, addCoupon, updateCoupon, deleteCoupon
} from '../controllers/orderController.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'
import optionalAuth from '../middleware/optionalAuth.js'

const orderRouter = express.Router()

// Admin features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)
orderRouter.post('/payment-status', adminAuth, updatePaymentStatus)

// Payment features
orderRouter.post('/place', authUser, placeOrder)
orderRouter.post('/stripe', authUser, placeOrderStripe)
orderRouter.post('/razorpay', authUser, placeOrderRazorpay)
orderRouter.post('/manual', authUser, placeOrderManual)
orderRouter.post('/guest', placeOrderGuest)

// User feature - using optional auth to support both logged-in users and email lookups
orderRouter.post('/userorders', optionalAuth, userOrders)

// Verify payment
orderRouter.post('/verifyStripe', authUser, verifyStripe)
orderRouter.post('/verifyRazorpay', authUser, verifyRazorpay)

// New features - coupons
orderRouter.post('/verify-coupon', verifyCoupon)
orderRouter.get('/coupons', adminAuth, getCoupons)
orderRouter.post('/coupon/add', adminAuth, addCoupon)
orderRouter.post('/coupon/update', adminAuth, updateCoupon)
orderRouter.post('/coupon/delete', adminAuth, deleteCoupon)

// Settings management
orderRouter.get('/settings', getSettings)
orderRouter.post('/settings/update', adminAuth, updateSettings)

// Crypto wallet management
orderRouter.get('/crypto-wallets', getCryptoWallets)
orderRouter.post('/crypto-wallet/add', adminAuth, addCryptoWallet)
orderRouter.post('/crypto-wallet/update', adminAuth, updateCryptoWallet)
orderRouter.post('/crypto-wallet/delete', adminAuth, deleteCryptoWallet)

export default orderRouter