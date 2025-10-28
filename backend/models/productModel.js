import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name : { type:String, required: true },
    description : { type:String, required: true },
    price: {type:Number, required:true},
    image : { type:Array, required: true },
    category : { type:String, required: true },
    subCategory : { type:String, required: true },
    bestseller : { type:Boolean },
    minOrderQuantity: { type:Number, default: 1 },
    quantityPriceList: { 
        type: String, // Storing as JSON string for flexibility
        default: null 
    },
    date: { type: Date, default: Date.now }
})

const productModel = mongoose.models.product || mongoose.model("product", productSchema)

export default productModel