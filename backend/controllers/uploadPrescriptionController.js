import prescriptionModel from '../models/prescriptionModel.js';
import { v2 as cloudinary } from "cloudinary"
const uploadPrescription = async (req, res) => {
  try {
    const { name, phone, email, notes, userId } = req.body;
    // Basic validation
    if (!name || !phone) {
      return res.json({ success: false, message: "Name and phone are required" });
    }

    // Upload images to Cloudinary
    let prescriptionImages = [];

    if (req.files) {
      const uploadedFiles = [
        req.files.image1 && req.files.image1[0],
        req.files.image2 && req.files.image2[0],
        req.files.image3 && req.files.image3[0],
        req.files.image4 && req.files.image4[0],
      ].filter(file => file !== undefined);

      if (uploadedFiles.length === 0) {
        return res.json({ success: false, message: "Please upload at least one prescription image" });
      }

      const uploadedUrls = await Promise.all(
        uploadedFiles.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'image',
            folder: 'prescriptions',
          });
          return result.secure_url;
        })
      );

      prescriptionImages = [...uploadedUrls];
    }

    const prescriptionData = {
      name,
      phone,
      email,
      notes,
      prescriptionImages,
      userId,
      date: Date.now(),
    };

    const newPrescription = new prescriptionModel(prescriptionData);
    await newPrescription.save();

    res.json({
      success: true,
      message: "Prescription uploaded successfully",
      data: newPrescription,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message || "Failed to upload prescription" });
  }
};

const getPrescriptions = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId; // Flexible
    const prescriptions = await prescriptionModel.find({ userId }).sort({ date: -1 });
    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

export { uploadPrescription, getPrescriptions };
