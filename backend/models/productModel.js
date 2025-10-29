import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name : { type:String, required: true },
    description : { type:String, required: true },
    price: {type:Number, required:true},
    image : { type:Array, default : ["https://user-gen-media-assets.s3.amazonaws.com/gemini_images/215b34ec-e0e1-47ae-8395-e4cb9f5ec2e7.png"] },
    category : { type:String, default : "Prescription Medicines" },
    subCategory : { type:String, default : "Tablets" },
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