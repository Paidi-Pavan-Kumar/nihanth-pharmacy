import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    packing: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    price: { type: Number, required: true },
    customerDiscount: { 
        type: Number, 
        required: true,
        min: 0,
        max: 100 
    },
    promoterDiscount: { 
        type: Number, 
        required: true,
        min: 0,
        max: 100 
    },
    promoCodeDiscount: { 
        type: Number,
        default: function() {
            return this.promoterDiscount / 2;
        }
    },
    image: { type: Array, default: ["https://user-gen-media-assets.s3.amazonaws.com/gemini_images/215b34ec-e0e1-47ae-8395-e4cb9f5ec2e7.png"] },
    category: { type: String, default: "Prescription Medicines" },
    subCategory: { type: String, default: "Tablets" },
    bestseller: { type: Boolean },
    minOrderQuantity: { type: Number, default: 1 },
    quantityPriceList: {
        type: String, // Storing as JSON string for flexibility
        default: null
    },
    date: { type: Date, default: Date.now }
})


// Price after customer discount
productSchema.virtual('sellingPrice').get(function () {
  return Number((this.price * (1 - this.customerDiscount / 100)).toFixed(2));
});

// Price after customer + promo code discount
productSchema.virtual('promoCodePrice').get(function () {
  const base = this.price * (1 - this.customerDiscount / 100);
  return Number((base * (1 - this.promoCodeDiscount / 100)).toFixed(2));
});

// Price after customer + promoter discount (if applicable)
productSchema.virtual('promoterPrice').get(function () {
  const base = this.price * (1 - this.customerDiscount / 100);
  return Number((base * (1 - this.promoterDiscount / 100)).toFixed(2));
});


// Ensure virtuals are included when converting document to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const productModel = mongoose.models.product || mongoose.model("product", productSchema)

export default productModel