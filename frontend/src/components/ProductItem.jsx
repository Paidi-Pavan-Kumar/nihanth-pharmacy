import { useContext } from 'react'
import PropTypes from 'prop-types'
import { ShopContext } from '../context/ShopContext'
import {Link} from 'react-router-dom'

const ProductItem = ({id, image, name, price, quantityPriceList}) => {

    const {currency} = useContext(ShopContext);
  
    // Get the lowest price from quantity price list if available
    const getDisplayPrice = () => {
        if (!quantityPriceList) return price;

        try {
            // Parse the quantity price list if it's a string
            const priceList = typeof quantityPriceList === 'string' 
                ? JSON.parse(quantityPriceList) 
                : quantityPriceList;

            if (Array.isArray(priceList) && priceList.length > 0) {
                // Find the lowest price option
                const lowestPriceOption = priceList.reduce((min, current) => 
                    parseFloat(current.price) < parseFloat(min.price) ? current : min
                , priceList[0]);
                
                return `${lowestPriceOption.price} (${lowestPriceOption.quantity} units)`;
            }
        } catch (error) {
            console.error("Error parsing quantity price list:", error);
        }
        
        return price;
    };

    return (
        <Link className='text-gray-700 dark:text-gray-300 cursor-pointer' to={`/product/${id}`}>
            <div className='overflow-hidden'>
                <img className='hover:scale-110 transition ease-in-out' src={image[0]} alt="" />
            </div>
            <p className='pt-3 pb-1 text-sm text-center'>{name}</p>
            <p className='text-sm font-medium text-center dark:text-white'>{currency}{getDisplayPrice()}</p>
        </Link>
    )
}

ProductItem.propTypes = {
    id: PropTypes.string.isRequired,
    image: PropTypes.array.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    quantityPriceList: PropTypes.oneOfType([PropTypes.string, PropTypes.array])
}

export default ProductItem
