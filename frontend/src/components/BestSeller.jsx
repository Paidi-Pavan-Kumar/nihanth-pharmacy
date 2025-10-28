import { useEffect, useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';
import { Loader2, ShoppingCart } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BestSeller = () => {
  const { backendUrl } = useContext(ShopContext);
  const [bestSeller, setBestSeller] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        const response = await axios.post(backendUrl + '/api/product/user/list', {
          bestseller: true,
          limit: 5,
          sortBy: 'date',
          sortOrder: 'desc'
        });
        
        if (response.data.success) {
          setBestSeller(response.data.products);
        }
      } catch (error) {
        console.error("Error fetching bestsellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [backendUrl]);

  return (
    <div className='my-10 dark:bg-gray-800'>
      <div className='text-center text-3xl py-8'>
        <Title text1={'BEST'} text2={'SELLERS'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:test-base text-gray-600 dark:text-gray-300'>
          These Items Are Selling Faster, Grab Yours Before The Stock Ends...!
        </p>
      </div>
    
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-10 h-10 animate-spin text-gray-500 dark:text-gray-300" />
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {bestSeller.map((item) => (
            <div key={item._id} className="flex flex-col items-center">
              <ProductItem 
                id={item._id} 
                image={item.image} 
                name={item.name} 
                price={item.price}
                quantityPriceList={item.quantityPriceList}
              />
              <Link 
                to={`/product/${item._id}`} 
                className="mt-2 mx-auto bg-primary dark:bg-[#02ADEE] text-white dark:text-gray-800 px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-primary/90 dark:hover:bg-yellow-500 transition-colors"
              >
                <ShoppingCart size={14} />
                Buy Now
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BestSeller;
