import { useEffect } from 'react'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useState } from 'react';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Cart = () => {
  const {products, currency, cartItems, updateQuantity, navigate, token, getItemTotal} = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);

  const proceedToPayment = () => {
    if(token){
      navigate('/place-order');
    }else{
      toast.info('Continuing as guest checkout');
      navigate('/guest-checkout');
    }
  }

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      Object.entries(cartItems).forEach(([itemId, itemData]) => {
        if (itemData && (typeof itemData === 'object' ? itemData.quantity > 0 : itemData > 0)) {
          tempData.push({
            _id: itemId,
            quantity: typeof itemData === 'object' ? itemData.quantity : itemData,
            selectedPrice: typeof itemData === 'object' ? itemData.selectedPrice : null,
            isPackage: typeof itemData === 'object' ? itemData.isPackage : false
          });
        }
      });
      setCartData(tempData);
    }
  }, [cartItems, products]);

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  // Enhanced Empty Cart component
  const EmptyCart = () => (
    <div className='flex flex-col items-center justify-center py-12 sm:py-20 px-4 dark:text-gray-200'>
      <img 
        src={assets.empty_cart} 
        alt="Empty Cart" 
        className="w-48 sm:w-56 mb-6 opacity-80 dark:opacity-60"
      />
      <h2 className='text-xl sm:text-2xl font-medium text-gray-600 dark:text-gray-300 mb-3'>
        Your Cart is Empty
      </h2>
      <p className='text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8 text-center'>
        Looks like you haven&apos;t added anything to your cart yet
      </p>
      <button 
        onClick={() => navigate('/products')} 
        className='bg-[#02ADEE] text-white px-8 py-3 rounded-full text-sm font-medium
                  hover:bg-[#0297cf] transition-colors duration-200
                  dark:bg-[#02ADEE] dark:hover:bg-[#0297cf]'
      >
        Browse Products
      </button>
    </div>
  );

  return (
    <div className='min-h-screen pt-20 pb-10 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-2xl mb-6 sm:mb-8'>
          <Title text1={'YOUR'} text2={'CART'}/>
        </div>
        
        {cartData.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Cart Items Section - Modified for landscape layout */}
            <div className='lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y dark:divide-gray-700'>
              {cartData.map((item, index) => {
                const productData = products.find(p => p._id === item._id);
                if (!productData) return null;

                const minOrderQuantity = productData.minOrderQuantity || 1;
                const displayPrice = item.selectedPrice || productData.price;
                const itemTotals = getItemTotal(item._id);
                const price = productData.price * (1 - productData.customerDiscount / 100)
                const qty = item.quantity;

                return (
                  <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-3">
                    {/* Line 1: very small image + name */}
                    <div className="flex items-center gap-3">
                      <img
                        src={productData.image?.[0] || ''}
                        alt={productData.name}
                        className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/product/${productData._id}`)}
                          className="text-sm sm:text-base font-medium text-gray-900 dark:text-white text-left truncate"
                        >
                          {productData.name}
                        </button>

                        {/* packing and customer discount on the same line */}
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="truncate">{productData.packing}</span>
                          {productData.customerDiscount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs font-semibold rounded">
                              {productData.customerDiscount}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Line 2: MRP, final price, qty controls (- +), remove */}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-[12px] text-gray-600 dark:text-gray-300">
                        <div>
  MRP:{" "}
  <span className="line-through text-red-500">
    {currency}{formatPrice(productData.price)}
  </span>
</div>
<div>
  Price:{" "}
  <span className="font-semibold text-green-600 dark:text-green-400">
    {currency}{formatPrice(price)}
  </span>
</div>

                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item._id, Math.max(minOrderQuantity, qty - 1))}
                          className="w-7 h-7 flex items-center justify-center rounded border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <div className="w-8 text-center text-sm">{qty}</div>

                        <button
                          onClick={() => updateQuantity(item._id, qty + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium">{currency}{formatPrice(itemTotals.final)}</div>
                        <button
                          onClick={() => updateQuantity(item._id, 0)}
                          className="mt-1 text-red-500 text-xs"
                          aria-label="Remove item"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Total Section - Unchanged */}
            <div className='lg:col-span-1'>
              <div className='sticky top-24'>
                <CartTotal />
                <button 
                  onClick={proceedToPayment}
                  className='w-full mt-4 px-6 py-3 bg-[#02ADEE] text-white rounded-lg font-medium
                           hover:bg-[#0297cf] transition-colors duration-200
                           dark:bg-[#02ADEE] dark:hover:bg-[#0297cf]'
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
