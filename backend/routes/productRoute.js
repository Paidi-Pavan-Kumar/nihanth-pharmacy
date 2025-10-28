import express from "express"
import { 
    listProduct, 
    listProductsForUsers,
    addProduct, 
    removeProduct, 
    editProduct, 
    getProductById 
} from "../controllers/productController.js"
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

// ===== USER ROUTES (No Auth Required) =====
// Route for user-facing product listing and filtering
productRouter.post('/user/list', listProductsForUsers);

// Get a single product by ID
productRouter.get('/:id', getProductById);

// ===== ADMIN ROUTES (Auth Required) =====
// Admin product management
productRouter.post('/add', adminAuth, upload.fields([{name:'image1', maxCount:1}, 
    {name:'image2', maxCount:1}, 
    {name:'image3', maxCount:1}, 
    {name:'image4', maxCount:1}]),addProduct);
    
productRouter.post('/remove', adminAuth, removeProduct);

// Admin product listing (with more filtering options)
productRouter.post('/list', listProduct);

productRouter.post('/edit', adminAuth, upload.fields([{name:'image1', maxCount:1}, 
    {name:'image2', maxCount:1}, 
    {name:'image3', maxCount:1}, 
    {name:'image4', maxCount:1}]), editProduct);

export default productRouter;
