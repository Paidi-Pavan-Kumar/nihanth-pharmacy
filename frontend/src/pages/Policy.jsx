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
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h3>
              <p>
                By accessing or using the services of Nihanth Pharmacy, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these Terms, you may not access or use our services.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2. Delivery Policy</h3>
              <p>
                Nihanth Pharmacy aims to deliver medicines within the estimated delivery time. However, actual delivery times may vary depending on the location, product availability, and external factors.
              </p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Express Delivery: Within 24 hours (where available)</li>
                <li>Free Shipping: Available on all orders</li>
              </ul>
              <p className="mt-2">
                For prescription medicines, a valid doctor’s prescription must be submitted before the order can be processed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3. Payment and Pricing</h3>
              <p>
                All product prices listed on our website are in Indian Rupees (INR) and include all applicable taxes.
              </p>
              <p className="mt-2">We accept the following payment methods:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>UPI payments</li>
                <li>Cash on Delivery (for eligible orders)</li>
              </ul>
              <p className="mt-2">
                Prices are subject to change without prior notice. However, confirmed orders will not be affected by subsequent price revisions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">4. Return and Refund Policy</h3>
              <p>
                Medicines may be returned within 5 days of delivery under the following conditions:
              </p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>The product received is damaged or expired</li>
                <li>The wrong product was delivered</li>
                <li>The product quality is compromised</li>
              </ul>
              <p className="mt-2">
                Refunds will be initiated within 2–3 business days after the returned product is received and inspected.
              </p>
              <p className="mt-2 italic">
                Note: Prescription medicines cannot be returned once dispensed, unless they are damaged or expired.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">5. Disclaimer of Warranties</h3>
              <p>
                All information provided by Nihanth Pharmacy is for general informational purposes only and should not be considered medical advice. Always consult a qualified healthcare professional for diagnosis or treatment.
              </p>
              <p className="mt-2">
                Nihanth Pharmacy makes no representations or warranties regarding the accuracy, reliability, or completeness of the information provided on its website or related materials.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">6. Customer Support</h3>
              <p>
                Our customer support team is available from Monday to Sunday, 7:00 AM – 10:00 PM (IST).
              </p>
              <p className="mt-2">You can reach us through:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                {loading ? (
                  <li className="text-sm opacity-70">Loading contact information...</li>
                ) : (
                  <>
                    <li>Email: {contactInfo.footerEmail}</li>
                    <li>Phone: {contactInfo.footerPhone}</li>
                  </>
                )}
                <li>Chat Support: Available on our website</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">7. Governing Law</h3>
              <p>
                These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall fall under the exclusive jurisdiction of the courts in India.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Last updated: March 2025. Nihanth Pharmacy reserves the right to modify these terms and conditions at any time. Continued use of our services after any modifications indicates your acceptance of the updated terms.
          </p>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default Policy;
