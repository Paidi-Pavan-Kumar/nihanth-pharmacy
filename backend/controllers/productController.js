import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

const DEFAULT_IMAGE = "https://user-gen-media-assets.s3.amazonaws.com/seedream_images/cb631c9c-ae97-4204-9740-9d9a20d24a5d.png";

const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, bestseller, minOrderQuantity, quantityPriceList } = req.body

        // Initialize imagesUrl with default image
        let imagesUrl = [DEFAULT_IMAGE];
        
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
                // Append uploaded images to imagesUrl array
                imagesUrl = [...imagesUrl, ...uploadedImages];
            }
        }
        
        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            minOrderQuantity: minOrderQuantity ? Number(minOrderQuantity) : 1,
            quantityPriceList: quantityPriceList || null,
            image: imagesUrl,
            date: Date.now()
        }
        
        const product = new productModel(productData);
        await product.save()

        res.json({success: true, message: "Product added"})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
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

const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true, message:"Product Removed"})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

const editProduct = async (req, res) => {
    try {
        const { id, name, description, price, category, subCategory, bestseller, minOrderQuantity, quantityPriceList, existingImages, imagesToReplace } = req.body;

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Parse JSON strings
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
        
        // Parse quantityPriceList if it's a string
        let parsedQuantityPriceList = null;
        if (quantityPriceList) {
            try {
                // If it's already a valid JSON string, parse it
                parsedQuantityPriceList = JSON.stringify(JSON.parse(quantityPriceList));
            } catch (e) {
                // If parsing fails, it might already be stringified or invalid
                console.log("Error parsing quantityPriceList:", e);
                return res.json({ success: false, message: "Invalid quantity price list format" });
            }
        }

        // Update product fields
        product.name = name;
        product.description = description;
        product.price = Number(price);
        product.category = category;
        product.subCategory = subCategory;
        product.bestseller = bestseller === "true";
        product.minOrderQuantity = minOrderQuantity ? Number(minOrderQuantity) : 1;
        product.quantityPriceList = parsedQuantityPriceList;
        product.image = newImagesUrl;

        await product.save();

        res.json({ success: true, message: "Product updated successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
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

const bulkAddProducts = async (req, res) => {
    try {
        // Expecting JSON body: { products: [ { name, description, price, category, subCategory, bestseller, minOrderQuantity, quantityPriceList, images: [urlOrBase64,...] }, ... ] }
        let { products } = req.body;
        if (!products) return res.json({ success: false, message: 'Provide products array in request body' });

        // If sent as string (form-data), parse it
        if (typeof products === 'string') products = JSON.parse(products);

        if (!Array.isArray(products) || products.length === 0) {
            return res.json({ success: false, message: 'Products must be a non-empty array' });
        }

        // Limit batch size to avoid memory/timeout issues (adjust as needed)
        const BATCH_LIMIT = 200;
        if (products.length > 1000) {
            return res.json({ success: false, message: 'Too many products in a single request. Split into multiple batches.' });
        }

        // Prepare product documents. If images array contains base64 data URIs, upload to Cloudinary.
        const productDocs = await Promise.all(products.map(async (p) => {
            const {
                name,
                description = '',
                price = 0,
                category = '',
                subCategory = '',
                bestseller = false,
                minOrderQuantity = 1,
                quantityPriceList = null,
                images = [] // array of urls or base64 data URIs
            } = p;

            let imagesUrl = [];

            if (Array.isArray(images) && images.length > 0) {
                // Upload data-URI images to Cloudinary, keep plain URLs as-is
                for (const img of images) {
                    try {
                        if (typeof img === 'string' && img.startsWith('data:')) {
                            const uploadResult = await cloudinary.uploader.upload(img, { resource_type: 'image' });
                            imagesUrl.push(uploadResult.secure_url);
                        } else if (typeof img === 'string' && img.trim() !== '') {
                            imagesUrl.push(img); // assume already a hosted URL
                        }
                    } catch (err) {
                        console.warn('Image upload failed for one image, skipping:', err.message);
                    }
                }
            }

            return {
                name,
                description,
                category,
                price: Number(price),
                subCategory,
                bestseller: bestseller === true || bestseller === 'true',
                minOrderQuantity: minOrderQuantity ? Number(minOrderQuantity) : 1,
                quantityPriceList: quantityPriceList || null,
                image: imagesUrl,
                date: Date.now()
            };
        }));

        // Insert many for performance
        const inserted = await productModel.insertMany(productDocs, { ordered: false }); // ordered:false continues on error

        res.json({ success: true, inserted: inserted.length, message: `${inserted.length} products added` });
    } catch (error) {
        console.error('bulkAddProducts error:', error);
        res.json({ success: false, message: error.message });
    }
};

export {addProduct, listProduct, listProductsForUsers, removeProduct, editProduct, getProductById, bulkAddProducts}