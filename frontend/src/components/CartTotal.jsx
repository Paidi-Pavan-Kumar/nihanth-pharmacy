import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';

const CartTotal = ({ couponDiscount = 0 }) => {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };
  
  // Calculate subtotal (cart amount)
  const subtotal = getCartAmount();
  
  // Calculate total (subtotal + delivery fee - discount)
  const total = subtotal + delivery_fee - couponDiscount;
  
  return (
    <div className='w-full dark:text-gray-200'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTALS'}/>
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between'>
            <p>Subtotal</p>
            <p>{currency} {formatPrice(subtotal)}</p>
        </div>
        <hr className="dark:border-gray-700" />
        <div className='flex justify-between'>
            <p>Shipping Fee</p>
            <p>{currency} {formatPrice(delivery_fee)}</p>
        </div>
        {couponDiscount > 0 && (
          <>
            <hr className="dark:border-gray-700" />
            <div className="flex justify-between text-green-600">
              <p>Discount:</p>
              <p>-{currency} {formatPrice(couponDiscount)}</p>
            </div>
          </>
        )}
        <hr className="dark:border-gray-700" />
        <div className='flex justify-between font-bold mt-3 text-lg'>
            <b>Total</b>
            <b>{currency} {formatPrice(total > 0 ? total : 0)}</b>
        </div>
      </div>
    </div>
  )
}

export default CartTotal
