import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

const DEFAULT_IMAGE = "https://user-gen-media-assets.s3.amazonaws.com/gemini_images/215b34ec-e0e1-47ae-8395-e4cb9f5ec2e7.png";

const addProduct = async (req, res) => {
    try {
        const { 
            name, 
            packing,
            companyName,
            description,
            price,
            profit,
            customerDiscount,
            promoterDiscount,
            category, 
            subCategory, 
            bestseller,
            minOrderQuantity,
            image: imageUrl 
        } = req.body;

        // Validate required fields
        if (!name || !packing || !companyName || !price || customerDiscount === undefined || promoterDiscount === undefined) {
            return res.json({ 
                success: false, 
                message: "Missing required fields" 
            });
        }

        // Initialize imagesUrl with provided imageUrl or default
        let imagesUrl = [imageUrl || DEFAULT_IMAGE];
        
        // Handle additional image uploads (up to 3 more)
        if (req.files) {
            const additionalImages = [
                req.files.image1 && req.files.image1[0],
                req.files.image2 && req.files.image2[0],
                req.files.image3 && req.files.image3[0]
            ].filter(item => item !== undefined);

            if (additionalImages.length > 0) {
                const uploadedImages = await Promise.all(
                    additionalImages.map(async (item) => {
                        let result = await cloudinary.uploader.upload(item.path, {
                            resource_type: 'image'
                        });
                        return result.secure_url;
                    })
                );
                imagesUrl = [...imagesUrl, ...uploadedImages];
            }
        }
        
        const productData = {
            name,
            packing,
            companyName,
            description,
            price: Number(price),
            profit : profit ? Number(profit) : 0,
            customerDiscount: Number(customerDiscount),
            promoterDiscount: Number(promoterDiscount),
            // promoCodeDiscount will be auto-calculated
            category: category || "Prescription Medicines",
            subCategory: subCategory || "Tablets",
            bestseller: bestseller === "true",
            minOrderQuantity: minOrderQuantity ? Number(minOrderQuantity) : 1,
            image: imagesUrl,
            date: Date.now()
        }
        
        const product = new productModel(productData);
        await product.save()
        console.log(product)
        res.json({success: true, message: "Product added"})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// Update bulkAddProducts for CSV import
const bulkAddProducts = async (req, res) => {
    try {
        let { products } = req.body;
        if (!products) return res.json({ success: false, message: 'Provide products array in request body' });

        if (typeof products === 'string') products = JSON.parse(products);

        if (!Array.isArray(products) || products.length === 0) {
            return res.json({ success: false, message: 'Products must be a non-empty array' });
        }

        if (products.length > 1000) {
            return res.json({ success: false, message: 'Too many products in a single request. Split into multiple batches.' });
        }

        const productDocs = products.map(p => ({
            name: p.Itemname,
            packing: p.Packing,
            companyName: p.Companyname,
            description: '', // Add description if needed
            price: Number(p.price),
            profit : profit ? Number(profit) : 0,
            customerDiscount: Number(p['Discount For Customer (%)']),
            promoterDiscount: Number(p['Discount for Promoter in %']),
            // promoCodeDiscount will be auto-calculated based on model
            image: [p.image || DEFAULT_IMAGE],
            category: "Prescription Medicines", // Set default or add to CSV
            subCategory: "Tablets", // Set default or add to CSV
            bestseller: false, // Set default or add to CSV
            minOrderQuantity: 1, // Set default or add to CSV
            date: Date.now()
        }));

        const inserted = await productModel.insertMany(productDocs, { ordered: false });

        res.json({ 
            success: true, 
            inserted: inserted.length, 
            message: `${inserted.length} products added` 
        });
    } catch (error) {
        console.error('bulkAddProducts error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update editProduct 
const editProduct = async (req, res) => {
    try {
        const { 
            id, 
            name, 
            packing,
            companyName,
            description,
            price,
            profit,
            customerDiscount,
            promoterDiscount,
            category, 
            subCategory, 
            bestseller,
            minOrderQuantity,
            existingImages, 
            imagesToReplace 
        } = req.body;

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Handle images same as before
        let imagesUrl = existingImages ? JSON.parse(existingImages) : [];
        const replacementMap = imagesToReplace ? JSON.parse(imagesToReplace) : {};
        
        // Handle image uploads
        const image1 = req.files?.image1 && req.files.image1[0];
        const image2 = req.files?.image2 && req.files.image2[0];
        const image3 = req.files?.image3 && req.files.image3[0];
        const image4 = req.files?.image4 && req.files.image4[0];
        
        // Map positions to images
        const positionImageMap = {
            0: image1,
            1: image2,
            2: image3,
            3: image4
        };

        // Process each position separately
        const uploadPromises = [];
        const newImagesUrl = [...imagesUrl]; // Create a new array to avoid mutation issues
        
        // Process each position that needs to be replaced
        for (const position in replacementMap) {
            if (replacementMap[position] && positionImageMap[position]) {
                // This position should be replaced with a new image
                uploadPromises.push(
                    cloudinary.uploader.upload(positionImageMap[position].path, {resource_type: 'image'})
                    .then(result => {
                        newImagesUrl[position] = result.secure_url;
                    })
                );
            }
        }
        
        // Wait for all uploads to complete
        if (uploadPromises.length > 0) {
            await Promise.all(uploadPromises);
        }
        
        // Update product fields
        product.name = name;
        product.packing = packing;
        product.companyName = companyName;
        product.description = description;
        product.price = Number(price);
        product.profit = profit ? Number(profit) : 0;
        product.customerDiscount = Number(customerDiscount);
        product.promoterDiscount = Number(promoterDiscount);
        product.category = category;
        product.subCategory = subCategory;
        product.bestseller = bestseller === "true";
        product.minOrderQuantity = minOrderQuantity ? Number(minOrderQuantity) : 1;
        product.image = newImagesUrl;

        await product.save();

        res.json({ success: true, message: "Product updated successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const listProduct = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            startDate,
            endDate,
            name,
            category,
            subCategory,
            hasMinOrder,
            hasQuantityPrice,
            sortBy = "date", // Default sort by date
            sortOrder = "desc" // Default sort order
        } = req.body;

        // Build filter query
        let query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        if (category && category !== "None" && category !== "") {
            // Handle array of categories
            if (Array.isArray(category) && category.length > 0) {
                query.category = { $in: category };
            } else {
                query.category = category;
            }
        }

        if (subCategory && subCategory !== "None" && subCategory !== "") {
            // Handle array of subcategories
            if (Array.isArray(subCategory) && subCategory.length > 0) {
                query.subCategory = { $in: subCategory };
            } else {
                query.subCategory = subCategory;
            }
        }

        if (hasMinOrder === true) {
            query.minOrderQuantity = { $gt: 1 };
        }

        if (hasQuantityPrice === true) {
            query.quantityPriceList = { $ne: null };
        }

        // Determine sort options
        const sortOptions = {};
        switch(sortBy) {
            case "price":
                sortOptions.price = sortOrder === "asc" ? 1 : -1;
                break;
            case "name":
                sortOptions.name = sortOrder === "asc" ? 1 : -1;
                break;
            case "date":
            default:
                sortOptions.date = sortOrder === "asc" ? 1 : -1;
                break;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalProducts = await productModel.countDocuments(query);

        // Get filtered and paginated products
        const products = await productModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            products,
            pagination: {
                total: totalProducts,
                pages: Math.ceil(totalProducts / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const listProductsForUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category = [],
            subCategory = [],
            search = "",
            sortBy = "date",
            sortOrder = "desc",
            bestseller = false,
            excludeId = null
        } = req.body;

        // Build filter query
        let query = {};

        // If bestseller flag is provided, filter for bestsellers
        if (bestseller === true) {
            query.bestseller = true;
        }

        // If excludeId is provided, exclude that product
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        // Add search filter if provided
        if (search && search.trim() !== "") {
            query.name = { $regex: search, $options: 'i' };
        }

        // Add category filter if provided and not empty
        if (Array.isArray(category) && category.length > 0) {
            query.category = { $in: category };
        } else if (category && typeof category === 'string' && category !== "" && category !== "None") {
            query.category = category;
        }

        // Add subCategory filter if provided and not empty
        if (Array.isArray(subCategory) && subCategory.length > 0) {
            query.subCategory = { $in: subCategory };
        } else if (subCategory && typeof subCategory === 'string' && subCategory !== "" && subCategory !== "None") {
            query.subCategory = subCategory;
        }

        // Determine sort options
        const sortOptions = {};
        switch(sortBy) {
            case "price":
                sortOptions.price = sortOrder === "asc" ? 1 : -1;
                break;
            case "name":
                sortOptions.name = sortOrder === "asc" ? 1 : -1;
                break;
            case "date":
            default:
                sortOptions.date = sortOrder === "asc" ? 1 : -1;
                break;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalProducts = await productModel.countDocuments(query);

        // Get filtered and paginated products
        const products = await productModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            products,
            pagination: {
                total: totalProducts,
                pages: Math.ceil(totalProducts / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Error in listProductsForUsers:", error);
        res.json({ success: false, message: error.message });
    }
};

// const listProductsForUsers = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             limit = 20,
//             category = [],
//             subCategory = [],
//             search = "",
//             sortBy = "date",
//             sortOrder = "desc",
//             bestseller = false,
//             excludeId = null
//         } = req.body;

//         const skip = (page - 1) * limit;

//         // Build aggregation pipeline
//         const pipeline = [];

//         // If search is provided, use Atlas Search
//         if (search && search.trim() !== "") {
//             pipeline.push({
//                 $search: {
//                     index: "default", // your index name
//                     text: {
//                         query: search,
//                         path: ["name"], // change if your product name field is different
//                         fuzzy: { maxEdits: 1 } // allows typos
//                     }
//                 }
//             });
//         }

//         // Exclude a product if needed
//         if (excludeId) {
//             pipeline.push({
//                 $match: { _id: { $ne: excludeId } }
//             });
//         }

//         // Filter by bestseller
//         if (bestseller === true) {
//             pipeline.push({ $match: { bestseller: true } });
//         }

//         // Filter by category
//         if (Array.isArray(category) && category.length > 0) {
//             pipeline.push({ $match: { category: { $in: category } } });
//         } else if (category && typeof category === "string" && category !== "None" && category !== "") {
//             pipeline.push({ $match: { category } });
//         }

//         // Filter by subCategory
//         if (Array.isArray(subCategory) && subCategory.length > 0) {
//             pipeline.push({ $match: { subCategory: { $in: subCategory } } });
//         } else if (subCategory && typeof subCategory === "string" && subCategory !== "None" && subCategory !== "") {
//             pipeline.push({ $match: { subCategory } });
//         }

//         // Sorting
//         const sortOptions = {};
//         switch (sortBy) {
//             case "price":
//                 sortOptions.price = sortOrder === "asc" ? 1 : -1;
//                 break;
//             case "name":
//                 sortOptions.name = sortOrder === "asc" ? 1 : -1;
//                 break;
//             case "date":
//             default:
//                 sortOptions.date = sortOrder === "asc" ? 1 : -1;
//                 break;
//         }
//         pipeline.push({ $sort: sortOptions });

//         // Pagination
//         pipeline.push({ $skip: skip });
//         pipeline.push({ $limit: parseInt(limit) });

//         // Execute aggregation
//         const products = await productModel.aggregate(pipeline);

//         // Total count for pagination (optional: can also use $searchMeta for more accurate count)
//         const totalProducts = await productModel.countDocuments(
//             search ? { name: { $regex: search, $options: "i" } } : {}
//         );

//         res.json({
//             success: true,
//             products,
//             pagination: {
//                 total: totalProducts,
//                 pages: Math.ceil(totalProducts / limit),
//                 currentPage: parseInt(page),
//                 limit: parseInt(limit)
//             }
//         });
//     } catch (error) {
//         console.error("Error in listProductsForUsers:", error);
//         res.json({ success: false, message: error.message });
//     }
// };


const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true, message:"Product Removed"})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Check if the ID is valid
        if (!productId || productId.length < 12) {
            return res.json({ success: false, message: "Invalid product ID" });
        }
        
        const product = await productModel.findById(productId);
        
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }
        
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {addProduct, listProduct, listProductsForUsers, removeProduct, editProduct, getProductById, bulkAddProducts}