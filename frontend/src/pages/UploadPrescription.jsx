import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import axios from "axios";

const UploadPrescription = () => {
  const navigate = useNavigate();
  const { backendUrl, token } = useContext(ShopContext);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate each file
    const validFiles = selectedFiles.filter((file) => {
      const isValid =
        file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024; // 5MB
      if (!isValid) {
        toast.error(`${file.name} must be an image under 5MB`);
      }
      return isValid;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.length) {
      toast.error("Please upload at least one prescription image");
      return;
    }

    if (!formData.name || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }

    try {
      setLoading(true);

      const formPayload = new FormData();
      files.forEach((file, index) => {
        formPayload.append(`image${index + 1}`, file);
      });
      Object.keys(formData).forEach((key) =>
        formPayload.append(key, formData[key])
      );

      

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token && { token: token }),
        },
      };

      

      const response = await axios.post(
        `${backendUrl}/api/prescription/upload`,
        formPayload,
        config
      );

      if (response.data.success) {
        toast.success("Prescription uploaded successfully");
        navigate("/orders");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to upload prescription"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Upload Prescription
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Prescription Images
              </label>

              <div className="flex flex-wrap gap-4">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span className="mt-2 text-xs text-gray-500">Add Image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <p className="text-xs text-gray-500">
                Upload clear images of your prescription (max 5MB each)
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Any specific instructions or details..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#02ADEE] hover:bg-[#0297cf] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Submit Prescription
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadPrescription;
