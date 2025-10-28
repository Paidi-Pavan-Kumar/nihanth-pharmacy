import { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

const RelatedProducts = ({category, subCategory, productId}) => {
  
    const {backendUrl} = useContext(ShopContext);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!category || !subCategory) return;
            
            try {
                setLoading(true);
                const response = await axios.post(backendUrl + '/api/product/user/list', {
                    category,
                    subCategory,
                    excludeId: productId,
                    limit: 5,
                    sortBy: 'date',
                    sortOrder: 'desc'
                });
                
                if (response.data.success) {
                    setRelated(response.data.products);
                }
            } catch (error) {
                console.error("Error fetching related products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedProducts();
    }, [category, subCategory, productId, backendUrl]);

    if (related.length === 0 && !loading) {
        return null;
    }

    return (
    <div className='my-24 dark:bg-gray-800'>
      <div className='text-center text-3xl py-2'>
        <Title text1={'RELATED'} text2={'PRODUCTS'} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-10 h-10 animate-spin text-gray-500 dark:text-gray-300" />
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {related.map((item) => (
            <ProductItem 
              key={item._id} 
              id={item._id} 
              name={item.name} 
              price={item.price} 
              image={item.image}
              quantityPriceList={item.quantityPriceList}
            />
          ))}
        </div>
      )}
    </div>
  )
}

RelatedProducts.propTypes = {
  category: PropTypes.string.isRequired,
  subCategory: PropTypes.string.isRequired,
  productId: PropTypes.string
}

export default RelatedProducts
