import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const CartTotal = ({ couponDiscount = 0 }) => {
  const { currency, getCartAmount } = useContext(ShopContext);

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  const subtotal = getCartAmount();
  const total = subtotal - couponDiscount;

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:text-gray-200">
      <div className="mb-6">
        <Title text1={"CART"} text2={"TOTALS"} />
      </div>

      <div className="space-y-4">
        {/* Subtotal Section */}
        <div className="flex justify-between items-center py-2">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Subtotal</p>
          <p className="text-sm sm:text-base font-medium">
            {currency} {formatPrice(subtotal)}
          </p>
        </div>
        
        <hr className="border-gray-200 dark:border-gray-700" />
        
        {/* Free Shipping Section */}
        <div className="flex justify-between items-center py-2">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Shipping</p>
          <span className="text-sm sm:text-base text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
            FREE
          </span>
        </div>

        {/* Coupon Discount Section */}
        {couponDiscount > 0 && (
          <>
            <hr className="border-gray-200 dark:border-gray-700" />
            <div className="flex justify-between items-center py-2">
              <p className="text-sm sm:text-base text-green-600 dark:text-green-400">Discount Applied</p>
              <p className="text-sm sm:text-base text-green-600 dark:text-green-400 font-medium">
                -{currency} {formatPrice(couponDiscount)}
              </p>
            </div>
          </>
        )}

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Total Section */}
        <div className="flex justify-between items-center py-3">
          <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
            Total
          </p>
          <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
            {currency} {formatPrice(total > 0 ? total : 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
