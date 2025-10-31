import { useContext } from 'react'
import PropTypes from 'prop-types'
import { ShopContext } from '../context/ShopContext'
import {Link} from 'react-router-dom'

const FALLBACK_IMG = "https://user-gen-media-assets.s3.amazonaws.com/seedream_images/cb631c9c-ae97-4204-9740-9d9a20d24a5d.png";

const ProductItem = ({id, image, name, price, packing, customerDiscount}) => {
    const {currency} = useContext(ShopContext);

    const imgSrc = (() => {
        if (!image) return FALLBACK_IMG;
        if (Array.isArray(image) && image.length) return image[0];
        if (typeof image === 'string' && image.trim()) return image;
        return FALLBACK_IMG;
    })();

    const formattedPrice = (val) => {
        const n = Number(val || 0);
        return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const sellingPrice = (() => {
        const mrp = Number(price || 0);
        const disc = Number(customerDiscount || 0);
        return (mrp * (1 - disc/100));
    })();

    return (
        <Link to={`/product/${id}`} className="block group">
            <div className="flex flex-col items-center text-center bg-white dark:bg-gray-800 rounded-lg p-3 hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-full overflow-hidden">
                    <img src={imgSrc} alt={name} className="w-full h-full object-contain" />
                </div>

                <div className="mt-3 w-full">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{packing || '-'}</p>

                    <div className="mt-3 flex flex-col items-center">
                        <div className="text-base font-semibold text-[#02ADEE] dark:text-yellow-400">
                            {currency}{formattedPrice(sellingPrice)}
                        </div>
                        <div className="text-xs text-gray-400 line-through mt-1">
                            MRP {currency}{formattedPrice(price)}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                            {customerDiscount ? `${customerDiscount}% OFF` : 'No discount'}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

ProductItem.propTypes = {
    id: PropTypes.string.isRequired,
    image: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    name: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    packing: PropTypes.string,
    customerDiscount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}

export default ProductItem
