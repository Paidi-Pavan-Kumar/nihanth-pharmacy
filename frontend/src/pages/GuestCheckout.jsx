// ...existing code...
import React from "react";
import { useNavigate } from "react-router-dom";

const GuestCheckout = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Return to login
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Please Login to place the order.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default GuestCheckout;
// ...existing code...