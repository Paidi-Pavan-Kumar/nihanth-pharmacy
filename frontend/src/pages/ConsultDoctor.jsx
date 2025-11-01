import React from 'react';
import { Calendar, Clock, Phone } from 'lucide-react';

const ConsultDoctor = () => {
  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-6 sm:pb-10 px-3 sm:px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
          {/* Header - Adjusted padding for mobile */}
          <div className="bg-[#02ADEE] px-4 sm:px-6 py-6 sm:py-8 text-white text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Online Doctor Consultation</h1>
            <p className="text-sm sm:text-base text-blue-100">Coming Soon to Nihanth Pharmacy</p>
          </div>

          {/* Content - Improved spacing for mobile */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  We're working hard to bring you convenient online doctor consultations.
                  Stay tuned for updates!
                </p>
              </div>

              {/* Features - Adjusted grid for better mobile layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
                {/* Feature 1 */}
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Calendar className="w-6 h-6 text-[#02ADEE]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Easy Scheduling
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Book appointments at your convenience
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Clock className="w-6 h-6 text-[#02ADEE]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    24/7 Availability
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Access healthcare anytime, anywhere
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1 sm:max-w-xs sm:mx-auto md:max-w-none">
                  <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Phone className="w-6 h-6 text-[#02ADEE]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Video Consultations
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Face-to-face interactions with doctors
                  </p>
                </div>
              </div>

              {/* Notification Form - Mobile optimized */}
              <div className="mt-8 sm:mt-12 text-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Get Notified When We Launch
                </h3>
                <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-[#02ADEE] text-white rounded-lg hover:bg-[#0297cf] transition-colors text-sm sm:text-base font-medium"
                  >
                    Notify Me
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultDoctor;
