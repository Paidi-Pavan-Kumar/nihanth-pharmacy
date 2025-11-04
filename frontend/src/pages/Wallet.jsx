import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Wallet = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading(true);
      try {
        if (!token) {
          setWalletData(null);
          setLoading(false);
          return;
        }

        let response;
        try {
          response = await axios.get(`${backendUrl}/api/order/coupon/getUserCoupon`, {
            headers: { token }
          });
        } catch (err) {
          console.warn('GET failed, trying POST:', err?.message);
          response = await axios.post(`${backendUrl}/api/order/coupon/getUserCoupon`, {}, {
            headers: { token }
          });
        }

        console.log('getUserCoupon response:', response?.data);

        if (!response?.data) {
          toast.error('Empty response from server');
          setWalletData(null);
          return;
        }

        if (!response.data.success) {
          toast.error(response.data.message || 'Failed to fetch wallet data');
          setWalletData(null);
          return;
        }

        const respData = response.data.data ?? response.data.coupon ?? null;
        if (!respData) {
          setWalletData(null);
          return;
        }

        const totalEarnings = Number(respData.totalEarnings ?? respData.totalEarning ?? respData.promoterAmount ?? 0);
        const transactions = Array.isArray(respData.transactions)
          ? respData.transactions
          : Array.isArray(response.data.transactions)
            ? response.data.transactions
            : [];
        const promoCode = respData.promoCode ?? respData.code ?? respData.phone ?? '—';
        const usedCount = Number(respData.usedCount ?? 0);

        setWalletData({ totalEarnings, transactions, promoCode, usedCount });
      } catch (error) {
        console.error('Fetch wallet error:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch wallet data');
        setWalletData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [backendUrl, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-blue-600" />
          <p className="text-sm text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: explanatory + promo card (shown even when not logged) */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-r from-emerald-50 to-white p-5 rounded-xl shadow-sm border">
              <h1 className="text-xl font-bold text-emerald-700 mb-2">My Wallet</h1>
              <p className="text-sm text-emerald-600 mb-4">Track earnings and learn how promoter discounts work.</p>

              <div className="bg-white p-4 rounded-lg shadow-inner border">
                <h3 className="text-sm font-medium text-gray-600">How discounts work</h3>
                <ul className="mt-3 text-sm text-gray-700 list-disc list-inside space-y-2">
                  <li><span className="font-semibold">Customer discount</span> — lowers product price for all customers.</li>
                  <li><span className="font-semibold">Promoter discount</span> — percent assigned per product; commission calculated when code is used.</li>
                  <li><span className="font-semibold">Your discount</span> — buyer using the promoter code gets 50% of promoter commission; promoter gets commission after delivery.</li>
                </ul>
                <p className="mt-3 text-xs text-gray-500">Example: Product ₹1000 → after customer discount ₹900. Promoter discount 10% → ₹90. Buyer gets ₹45 off; promoter earns ₹90 after delivery.</p>

                {/* Promotional link */}
                <div className="mt-3 text-sm">
                  <p className="text-xs text-gray-600 mb-1">Promote our store and earn — share this link:</p>
                  <a
                    href="https://nihanth-pharma.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md hover:bg-indigo-100"
                  >
                    https://nihanth-pharma.vercel.app/
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: prompt to login (instead of wallet details) */}
          <div className="lg:col-span-2 flex items-center justify-center">
            <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Please login to view your wallet</h2>
              <p className="text-sm text-gray-500 mb-4">Your earnings and promoter stats are available after login.</p>
              <Link to="/login" className="inline-block px-6 py-2 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow">
                Login Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalEarnings = Number(walletData?.totalEarnings ?? 0);
  const transactions = walletData?.transactions ?? [];
  const promoCode = walletData?.promoCode ?? '—';
  const usedCount = walletData?.usedCount ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Middle: total earnings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-xl shadow-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="mt-2 text-3xl font-extrabold text-blue-700">₹{totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Credited to your wallet after order delivery.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard?.writeText(promoCode).then(() => toast.success('Code copied'))}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm shadow"
              >
                Copy Code
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText("https://nihanth-pharma.vercel.app/").then(() => toast.success('Store link copied.Share this Link to Earn'))}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-sm shadow"
              >
                Share
              </button>
            </div>
          </div>
          <div className="mt-4 bg-gradient-to-r from-indigo-50 to-white p-4 rounded-lg border">
              <h4 className="text-sm font-medium text-indigo-700">Share your code</h4>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="font-mono text-lg text-indigo-900 bg-indigo-100 px-3 py-2 rounded-md">{promoCode}</div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Used</p>
                  <p className="text-sm font-semibold text-indigo-700">{usedCount}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">Share this code with friends. You earn when they complete paid deliveries.</p>
            </div>
        {/* Left: explanatory + promo card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-r from-emerald-50 to-white p-5 rounded-xl shadow-sm border">
            <h1 className="text-xl font-bold text-emerald-700 mb-2">My Wallet</h1>
            <p className="text-sm text-emerald-600 mb-4">Track your earnings and promoter stats here.</p>

            <div className="bg-white p-4 rounded-lg shadow-inner border">
              <h3 className="text-sm font-medium text-gray-600">How discounts work</h3>
              <ul className="mt-3 text-sm text-gray-700 list-disc list-inside space-y-2">
                <li><span className="font-semibold">Customer discount</span> — lowers product price for all customers.</li>
                <li><span className="font-semibold">Promoter discount</span> — percent assigned per product; commission calculated when code is used.</li>
                <li><span className="font-semibold">Your discount</span> — buyer using the promoter code gets 50% of promoter commission; promoter gets commission after delivery.</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">Example: Product ₹1000 → after customer discount ₹900. Promoter discount 10% → ₹90. Buyer gets ₹45 off; promoter earns ₹90 after delivery.</p>

              {/* Promotional link (visible to guests too) */}
              <div className="mt-3 text-sm">
                <p className="text-xs text-gray-600 mb-1">Promote our store and earn — share this link:</p>
                <a
                  href="https://nihanth-pharma.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md hover:bg-indigo-100"
                >
                  https://nihanth-pharma.vercel.app/
                </a>
              </div>
            </div>
          </div>
        </div>




          {/* Small info / actions */}
          <div className="flex flex-col sm:flex-row gap-4">
        
            <div className="w-full sm:w-64 bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="text-sm font-medium text-gray-700">Tips</h4>
              <ul className="text-xs text-gray-600 mt-2 space-y-2 list-disc list-inside">
                <li>Share code on social media for more uses.</li>
                <li>Credits are added only after delivery.</li>
                <li>Refunds will reverse the credited amount.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;

