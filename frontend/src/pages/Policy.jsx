import { useState, useEffect } from "react";
import {
  ScrollText,
  ShieldCheck,
  Truck,
  CreditCard,
  Scale,
  FileWarning,
  HelpCircle,
  Signature,
  ClipboardCopy,
} from "lucide-react";
import Title from "../components/Title";
import NewsLetterBox from "../components/NewsLetterBox";
import axios from "axios";

const Policy = () => {
  const [contactInfo, setContactInfo] = useState({
    footerEmail: "nihanthpharmacy@gmail.com",
    footerPhone: "+91 8904193463",
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
  const copyToClipboard = () => {
    const text = document.getElementById("terms-content").innerText;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Terms and Conditions copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div className="min-h-screen">
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={"TERMS &"} text2={"CONDITIONS"} />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <ScrollText className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">
                Nihanth Pharmacy Terms and Conditions
              </h2>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <ClipboardCopy size={16} />
              <span>Copy</span>
            </button>
          </div>

          <div className="text-gray-600 space-y-6" id="terms-content">
            <div className="flex gap-4">
              <ShieldCheck
                className="text-primary flex-shrink-0 mt-1"
                size={20}
              />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  1. Acceptance of Terms
                </h3>
                <p>
                  By accessing or using Nihanth Pharmacy Medicine services, you
                  agree to be bound by these Terms and Conditions. If you do not
                  agree to all the terms and conditions, you may not access or
                  use our services.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Truck className="text-primary flex-shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  2. Delivery Policy
                </h3>
                <p>
                  Nihanth Pharmacy strives to deliver medicines within the
                  estimated delivery time. However, delivery times may vary
                  based on location and availability. For prescription
                  medications, a valid prescription is required before
                  processing the order.
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Standard delivery: 2-3 business days</li>
                  <li>Express delivery: 24 hours (where available)</li>
                  <li>Free shipping on orders above $500</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <CreditCard
                className="text-primary flex-shrink-0 mt-1"
                size={20}
              />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  3. Payment and Pricing
                </h3>
                <p>
                  All prices listed on our website are in Indian Rupees (INR)
                  and are inclusive of applicable taxes. We accept various
                  payment methods including credit/debit cards, net banking,
                  UPI, and cash on delivery (for eligible orders).
                </p>
                <p className="mt-2">
                  We reserve the right to change prices of products at any time
                  without prior notice. Any price change will not affect orders
                  that have already been confirmed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Scale className="text-primary flex-shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  4. Return and Refund Policy
                </h3>
                <p>Medicines can be returned within 7 days of delivery if:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>The product received is damaged or expired</li>
                  <li>The wrong product was delivered</li>
                  <li>The product quality is compromised</li>
                </ul>
                <p className="mt-2">
                  Refunds will be processed within 7-10 business days after the
                  returned product is received and inspected. Prescription
                  medicines cannot be returned once dispensed unless they are
                  damaged or expired.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <FileWarning
                className="text-primary flex-shrink-0 mt-1"
                size={20}
              />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  5. Disclaimer of Warranties
                </h3>
                <p>
                  Nihanth Pharmacy provides information on medicines for general
                  informational purposes only. This information should not be
                  considered as medical advice. Always consult with a qualified
                  healthcare provider for medical advice, diagnosis, or
                  treatment.
                </p>
                <p className="mt-2">
                  We make no warranties or representations about the accuracy or
                  completeness of the content provided on our website.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <HelpCircle
                className="text-primary flex-shrink-0 mt-1"
                size={20}
              />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  6. Customer Support
                </h3>
                <p>
                  Our customer support team is available from Monday to
                  Saturday, 9:00 AM to 6:00 PM IST. You can reach us through:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  {loading ? (
                    <li className="text-sm opacity-70">
                      Loading contact information...
                    </li>
                  ) : (
                    <>
                      <li>Email: {contactInfo.footerPhone}</li>
                      <li>Phone: {contactInfo.footerEmail}</li>
                    </>
                  )}
                  <li>Chat support on our website</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <Signature
                className="text-primary flex-shrink-0 mt-1"
                size={20}
              />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  7. Governing Law
                </h3>
                <p>
                  These Terms and Conditions shall be governed by and construed
                  in accordance with the laws of India. Any disputes arising
                  under these Terms and Conditions shall be subject to the
                  exclusive jurisdiction of the courts in India.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Last updated: March 2025. Nihanth Pharmacy reserves the right to modify
            these terms and conditions at any time. Continued use of our
            services after any modifications indicates your acceptance of the
            updated terms.
          </p>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default Policy;
