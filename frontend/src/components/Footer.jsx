import { useState, useEffect } from 'react';
import { Link, NavLink } from "react-router-dom";
import axios from 'axios';

const Footer = () => {
  const [contactInfo, setContactInfo] = useState({
    footerEmail: 'nihanthpharmacy@gmail.com',
    footerPhone: '+91 8904193463'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await axios.get(`${backendUrl}/api/order/settings`);
        
        if (response.data.success) {
          setContactInfo(response.data.settings);
        }
      } catch (error) {
        console.error("Failed to fetch footer information:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="bg-[#7ccfff] dark:bg-gray-900 mt-10 py-8 px-6 shadow-inner">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 mb-10 text-small">
        <div>
          <Link to="/" className="font-display text-2xl text-primary dark:text-[#02ADEE]">
            MediQuick
          </Link>
          <p className="w-full md:w-2/3 text-gray-600 dark:text-gray-300 mt-2">
            Your Trusted Online Medicine & Healthcare Partner
          </p>
        </div>

        <div>
          <p className="text-xl font-medium mb-5 text-gray-800 dark:text-gray-100">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
            <li>
              <NavLink to="/products" className="hover:text-primary dark:hover:text-[#02ADEE] transition-colors">Products</NavLink>
            </li>
            <li>
              <NavLink to="/about" className="hover:text-primary dark:hover:text-[#02ADEE] transition-colors">About</NavLink>
            </li>
            <li>
              <NavLink to="/contact" className="hover:text-primary dark:hover:text-[#02ADEE] transition-colors">Contact Us</NavLink>
            </li>
            <li>
              <NavLink to="/policy" className="hover:text-primary dark:hover:text-[#02ADEE] transition-colors">Terms & Conditions</NavLink>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5 text-gray-800 dark:text-gray-100">Get In Touch</p>
          <ul className="flex flex-col gap-2 text-gray-600 dark:text-gray-300">
            {loading ? (
              <li className="text-sm opacity-70">Loading contact information...</li>
            ) : (
              <>
                <li>{contactInfo.footerPhone}</li>
                <li>{contactInfo.footerEmail}</li>
              </>
            )}
          </ul>
        </div>
      </div>
      <div>
  <hr className="border-gray-300 dark:border-gray-700" />
  <p className="py-5 text-sm text-center text-gray-600 dark:text-gray-300">
    ©{" "}
    <a
      href="https://www.linkedin.com/company/patha-projects"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
    >
      PaTh Innovations
    </a>{" "}
    | 2025 All Rights Reserved.
  </p>
</div>

    </div>
  );
};

export default Footer;
