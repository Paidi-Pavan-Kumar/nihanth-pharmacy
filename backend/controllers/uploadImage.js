import { v2 as cloudinary } from "cloudinary";

const uploadImage = async (req, res) => {
    // Ensure the image field exists and has a file
    if (!req.files || !req.files.image || req.files.image.length === 0) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const image = req.files.image[0]; // Access the first file in the array

    try {
        const result = await cloudinary.uploader.upload(image.path, { resource_type: 'image' });

        res.json({ success: true, message: "Image uploaded", url: result.secure_url });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export { uploadImage };
