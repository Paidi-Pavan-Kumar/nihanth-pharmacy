import prescriptionModel from '../models/prescriptionModel.js';
import { v2 as cloudinary } from "cloudinary"
import AdminToken from "../models/AdminToken.js";
import { sendNotification } from "../firebase.js";
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
    
    const adminTokens = await AdminToken.find().lean();
                    const tokens = adminTokens.map(t => t.token);
                    if (tokens.length > 0) {
                        try {
                            await sendNotification(
                                tokens,
                                "New Precription Received",
                                `You have received a new Prescription. Please check your dashboard to respond.`
                            );
                        } catch (err) {
                            console.error("Notification send failed (non-fatal):", err);
                            // continue — do not block order placement for notification failures
                        }
                    }

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

const deletePrescription = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) return res.status(400).json({ success: false, message: "Prescription id required" });

    const pres = await prescriptionModel.findById(id);
    if (!pres) return res.status(404).json({ success: false, message: "Prescription not found" });

    const imageUrls = pres.prescriptionImages || [];
    if (imageUrls.length > 0) {
      // Best-effort: try to derive public_id from url and delete
      await Promise.allSettled(imageUrls.map(async (url) => {
        try {
          // Matches /v123/.../folder/name.ext  => captures folder/name
          const m = url.match(/\/(?:v\d+\/)?(.+)\.(?:jpg|jpeg|png|gif|webp|pdf|bmp|tiff)$/i);
          if (m && m[1]) {
            const publicId = decodeURIComponent(m[1]);
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (e) {
          // ignore individual failures, but log for debugging
          console.warn("Failed to delete cloudinary image for url:", url, e.message || e);
        }
      }));
    }

    await prescriptionModel.findByIdAndDelete(id);
    return res.json({ success: true, message: "Prescription deleted" });
  } catch (error) {
    console.error("Delete prescription error:", error);
    return res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

export { uploadPrescription, getPrescriptions, deletePrescription };
