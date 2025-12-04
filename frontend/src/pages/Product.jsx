import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { Star, StarHalf } from "lucide-react";
import RelatedProducts from "../components/RelatedProducts";
import { Loader2, AlertTriangle } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const FALLBACK_IMG =
  "https://user-gen-media-assets.s3.amazonaws.com/seedream_images/cb631c9c-ae97-4204-9740-9d9a20d24a5d.png";

const Product = () => {
  const { productId } = useParams();
  const { currency = "₹", addToCart, backendUrl } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [image, setImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  const format = (v) =>
    Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${backendUrl}/api/product/${productId}`);
      if (res.data?.success && res.data.product) {
        const p = res.data.product;
        setProductData(p);
        const firstImage =
          Array.isArray(p.image) && p.image.length ? p.image[0] : p.image || FALLBACK_IMG;
        setImage(firstImage);
        setQuantity(p.minOrderQuantity ? Number(p.minOrderQuantity) : 1);
      } else {
        setError(res.data?.message || "Product not found");
        toast.error(res.data?.message || "Product not found");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load product");
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchProductData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, backendUrl]);

  const increase = () => setQuantity((q) => q + 1);
  const decrease = () => setQuantity((q) => (q > (productData?.minOrderQuantity || 1) ? q - 1 : q));

  if (loading) {
    return (
      <div className="pt-28 min-h-screen flex items-center justify-center bg-white dark:bg-gray-800">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500 dark:text-gray-300" />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="pt-28 min-h-screen flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow text-center max-w-lg">
          <AlertTriangle className="mx-auto mb-4 w-12 h-12 text-yellow-500" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {error || "Product not available"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Try returning to products list.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate("/products")} className="px-4 py-2 bg-[#02ADEE] text-white rounded">
              Browse Products
            </button>
            <button onClick={fetchProductData} className="px-4 py-2 border rounded">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // show price and discount fields requested by user
  const rawPrice = Number(productData.mrp ?? productData.price ?? 0);
  const promoterDiscount = Number(productData.promoterDiscount ?? 0);
  const referralDiscount = Number(promoterDiscount / 2);
  const customerDiscount = Number(productData.customerDiscount ?? 0);
  const sellingPrice = rawPrice * (1 - customerDiscount / 100);


  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-12 bg-white dark:bg-gray-800 min-h-screen transition">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white">
            {productData.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            {productData.companyName} • {productData.packing}
          </p>
        </div>

        {/* Layout: image left, info right on md+, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Image */}
          <div className="md:col-span-2 flex justify-center">
            <div className="w-full max-w-[220px] bg-gray-50 dark:bg-gray-900 rounded-lg p-2 flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm">
              <img
                src={image || FALLBACK_IMG}
                alt={productData.name}
                className="w-full max-h-[140px] sm:max-h-[160px] md:max-h-[180px] object-contain"
              />
            </div>
          </div>

          {/* Info / actions */}
          <div className="md:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-100 dark:border-gray-700 shadow">
              <div className="flex flex-col gap-2">
                {/* Price Section - Enhanced Styling */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-3xl md:text-4xl font-bold text-[#02ADEE] dark:text-[#02ADEE]">
                    {currency} {format(sellingPrice)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">MRP
                    <span className="text-base text-gray-400 line-through">
                       {currency} {format(rawPrice)}
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium rounded">
                      {customerDiscount}% OFF
                    </span>
                  </div>

                  {/* You save amount */}
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300 font-semibold">
                    You save {currency} {format(Math.max(0, rawPrice - sellingPrice))}
                  </div>
                  
                  {/* Discounts Info */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid gap-3">
                      {/* Customer Discount - Simple row */}
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 text-sm">
                        <span>Customer Discount:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{customerDiscount}%</span>
                      </div>

                      {/* Promoter Discount - Compact card */}
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Refer & Earn</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Share your phone number as coupon and earn rewards on every referral</div>
                          </div>
                          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {promoterDiscount}%
                          </div>
                        </div>
                      </div>

                      {/* Referral Discount - Compact card */}
                      <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">If code applied</div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">Note:- 50% of promoter benifits</div>
                          </div>
                          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {50}%
                          </div>
                        </div>
                      </div>
                
                    </div>
                  </div>
                </div>

                {/* Compact details */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <div className="text-xs text-gray-500">Packing</div>
                    <div className="font-medium">{productData.packing || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Company</div>
                    <div className="font-medium">{productData.companyName || "-"}</div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="mt-4">
                  <label className="text-sm text-gray-600 dark:text-gray-300">Quantity</label>
                  <div className="inline-flex items-center border rounded-md overflow-hidden mt-2">
                    <button onClick={decrease} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-lg">−</button>
                    <div className="px-6 py-2">{quantity}</div>
                    <button onClick={increase} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-lg">+</button>
                  </div>
                  {productData.minOrderQuantity > 1 && (
                    <div className="text-xs text-orange-600 mt-2">Minimum order: {productData.minOrderQuantity}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      addToCart(productData._id, { quantity, selectedPrice: sellingPrice, customerDiscount: productData.customerDiscount, packing : productData.packing,
        promoterDiscount: productData.promoterDiscount });
                      // toast.success("Added to cart");
                    }}
                    className="w-full px-4 py-2 rounded-md bg-[#02ADEE] text-white font-medium hover:opacity-95"
                  >
                    Add to cart
                  </button>

                  <button
                    onClick={() => {
                      addToCart(productData._id, { quantity, selectedPrice: sellingPrice, customerDiscount: productData.customerDiscount, packing : productData.packing,
        promoterDiscount: productData.promoterDiscount});
                      navigate("/cart");
                    }}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50"
                  >
                    Buy now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 bg-white dark:bg-gray-900 p-4 rounded border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium dark:text-white">Product Details</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            {productData.content || productData.description || "No additional details provided."}
          </p>
        </div>

        {/* Related products */}
        <div className="mt-8">
          <RelatedProducts category={productData.category} subCategory={productData.subCategory} productId={productId} />
        </div>
      </div>
    </div>
  );
};

export default Product;
