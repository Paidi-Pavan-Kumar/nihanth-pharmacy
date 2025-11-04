import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios"
import PropTypes from 'prop-types';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    
    const currency = '₹';
    const delivery_fee = 0;
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch]= useState(true);
    const [cartItems, setCartItem] = useState({});
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [productsPagination, setProductsPagination] = useState({
        total: 0,
        pages: 0,
        currentPage: 1,
        limit: 20
    });
    const [filters, setFilters] = useState({
        category: [],
        subCategory: [],
        search: '',
        sortBy: 'date',
        sortOrder: 'desc'
    });
    const [token, setToken] = useState('');
    const navigate = useNavigate();

    // Function to update filters and fetch products
    const updateFilters = (newFilters) => {
        // Create new filters by merging existing filters with new ones
        const updatedFilters = {
            ...filters,
            ...newFilters
        };
        
        // Update the filters state
        setFilters(updatedFilters);
        
        // Reset to page 1 when filters change
        setProductsPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
        
        // Force a data fetch right away instead of relying on the useEffect
        fetchProductsWithCurrentFilters(updatedFilters);
    };
    
    // A helper function to immediately fetch with the given filters
    const fetchProductsWithCurrentFilters = async (currentFilters) => {
        try {
            setLoading(true);            
            // Use the new user-specific endpoint
            const response = await axios.post(backendUrl + '/api/product/user/list', {
                page: 1, // Always start at page 1 for a new filter set
                limit: productsPagination.limit,
                ...currentFilters,
                search: currentFilters.search || search // Use either direct search or from filters
            });
            
            if (response.data.success) {
                setProducts(response.data.products);
                setProductsPagination({
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages,
                    currentPage: response.data.pagination.currentPage,
                    limit: response.data.pagination.limit
                });
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to set page for pagination
    const setPage = (page) => {
        if (page < 1 || page > productsPagination.pages) return;
        
        const newPage = parseInt(page);
        
        setProductsPagination(prev => ({
            ...prev,
            currentPage: newPage
        }));
        
        // Fetch the data for the new page
        fetchProductsForPage(newPage);
    };
    
    // Helper function to fetch products for a specific page
    const fetchProductsForPage = async (page) => {
        try {
            setLoading(true);
            
            // Use the new user-specific endpoint
            const response = await axios.post(backendUrl + '/api/product/user/list', {
                page: page,
                limit: productsPagination.limit,
                ...filters,
                search: filters.search || search // Use either direct search or from filters
            });
            
            if (response.data.success) {
                setProducts(response.data.products);
                setProductsPagination({
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages,
                    currentPage: response.data.pagination.currentPage,
                    limit: response.data.pagination.limit
                });
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (itemId, itemData) => {
        // Convert old format to new format if needed
        const cartData = typeof itemData === 'number' ? {
            quantity: itemData,
            selectedPrice: null,
            isPackage: false
        } : itemData;

        // Validate cart data
        if (!cartData || typeof cartData !== 'object') {
            console.error('Invalid cart data');
            return;
        }

        // Ensure quantity exists and is a number
        if (!cartData.quantity || isNaN(cartData.quantity)) {
            cartData.quantity = 1;
        }

        // Find the product to check for minimum order quantity
        const product = products.find(p => p._id === itemId);
        console.log(product)
        if (!product) {
            console.error('Product not found');
            return;
        }

        // Ensure quantity meets minimum order quantity if not a package
        if (!cartData.isPackage) {
            const minQuantity = product.minOrderQuantity || 1;
            if (cartData.quantity < minQuantity) {
                toast.error(`Minimum order quantity for this product is ${minQuantity}`);
                cartData.quantity = minQuantity;
            }
        }

        try {
            let newCartItems = structuredClone(cartItems);
            newCartItems[itemId] = cartData;
            setCartItem(newCartItems);
            toast.success('Item Added to Cart');

            if(token){
                await axios.post(backendUrl + '/api/cart/add', {
                    itemId, 
                    cartData
                }, {
                    headers: {token}
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error(error.message || 'Error adding item to cart');
        }
    }

    const getCartCount = () => {
        let totalCount = 0;
        Object.values(cartItems).forEach(item => {
            if (!item) return;
            
            if (typeof item === 'object' && item.quantity > 0) {
                totalCount += item.quantity;
            } else if (typeof item === 'number' && item > 0) {
                totalCount += item;
            }
        });
        return totalCount;
    }

    const getTypeOfProductsAddedInCart = () => {
        // Count the number of unique product IDs in the cart
        return Object.keys(cartItems).filter(itemId => {
          const item = cartItems[itemId];
          // Only count items that exist and have positive quantity
          if (!item) return false;
          
          const quantity = typeof item === 'object' ? item.quantity : item;
          return quantity > 0;
        }).length;
      }

    const updateQuantity = async (itemId, itemData) => {
        try {
            // Convert old format to new format if needed
            const cartData = typeof itemData === 'number' ? {
                quantity: itemData,
                selectedPrice: null,
                isPackage: false
            } : itemData;

            // Validate cart data
            if (!cartData || typeof cartData !== 'object') {
                console.error('Invalid cart data');
                return;
            }

            // If quantity is 0 or invalid, remove from cart
            if (!cartData.quantity || cartData.quantity === 0) {
                let newCartItems = structuredClone(cartItems);
                delete newCartItems[itemId];
                setCartItem(newCartItems);

                if (token) {
                    await axios.post(backendUrl + '/api/cart/update', {
                        itemId, 
                        cartData: { quantity: 0 }
                    }, {
                        headers: {token}
                    });
                }
                return;
            }

            // Find the product to check for minimum order quantity
            const product = products.find(p => p._id === itemId);
            if (!product) {
                console.error('Product not found');
                return;
            }

            // Ensure quantity meets minimum order quantity if not a package
            if (!cartData.isPackage) {
                const minQuantity = product.minOrderQuantity || 1;
                if (cartData.quantity < minQuantity) {
                    toast.error(`Minimum order quantity for this product is ${minQuantity}`);
                    cartData.quantity = minQuantity;
                }
            }

            let newCartItems = structuredClone(cartItems);
            newCartItems[itemId] = cartData;
            setCartItem(newCartItems);

            if (token) {
                await axios.post(backendUrl + '/api/cart/update', {
                    itemId, 
                    cartData
                }, {
                    headers: {token}
                });
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.error(error.message || 'Error updating quantity');
        }
    }

    const getItemTotal = (itemId) => {
        const item = cartItems[itemId];
        if (!item) return { mrp: 0, discount: 0, final: 0 };

        const quantity = typeof item === 'object' ? item.quantity : item;
        const product = products.find((p) => p._id === itemId);
        
        if (!product) return { mrp: 0, discount: 0, final: 0 };

        if (typeof item === 'object' && item.isPackage && item.selectedPrice) {
            // For package items
            const packagePrice = parseFloat(item.selectedPrice);
            return {
                mrp: packagePrice,
                discount: 0,
                final: packagePrice
            };
        } else {
            // For regular items
            const mrpPrice = product.price * quantity;
            const discountAmount = (mrpPrice * product.customerDiscount) / 100;
            const finalPrice = mrpPrice - discountAmount;
            const promoterDiscountAmount = (finalPrice * (product.promoterDiscount / 2)) / 100;
            const finalPriceAfterPromoterDiscount = finalPrice - promoterDiscountAmount;
            return {
                mrp: Math.round(mrpPrice * 100) / 100,
                discount: Math.round(discountAmount * 100) / 100,
                final: Math.round(finalPrice * 100) / 100,
                finalPriceAfterPromoterDiscount: Math.round(finalPriceAfterPromoterDiscount * 100) / 100
            };
        }
    };

    const getCartAmount = () => {
        let totals = {
            mrp: 0,
            discount: 0,
            final: 0,
            finalPriceAfterPromoterDiscount: 0
        };

        for (const itemId in cartItems) {
            const itemTotals = getItemTotal(itemId);
            totals.mrp += itemTotals.mrp;
            totals.discount += itemTotals.discount;
            totals.final += itemTotals.final;
            totals.finalPriceAfterPromoterDiscount += itemTotals.finalPriceAfterPromoterDiscount;
        }

        // Round all values to 2 decimal places
        return {
            mrp: Math.round(totals.mrp * 100) / 100,
            discount: Math.round(totals.discount * 100) / 100,
            final: Math.round(totals.final * 100) / 100,
            finalPriceAfterPromoterDiscount: Math.round(totals.finalPriceAfterPromoterDiscount * 100) / 100
        };
    };

    // Update getCartItems to include price details
    const getCartItems = () => {
        const items = [];
        for(const itemId in cartItems) {
            const item = cartItems[itemId];
            if (!item) continue;

            const product = products.find(p => p._id === itemId);
            if (!product) continue;

            const quantity = typeof item === 'object' ? item.quantity : item;
            if (quantity <= 0) continue;

            const priceDetails = getItemTotal(itemId);

            items.push({
                _id: itemId,
                name: product.name,
                image: product.image[0],
                quantity: quantity,
                customerDiscount: product.customerDiscount,
                promoterDiscount: product.promoterDiscount,
                isPackage: typeof item === 'object' ? item.isPackage : false,
                prices: {
                    mrp: priceDetails.mrp,
                    discount: priceDetails.discount,
                    final: priceDetails.final,
                    unitMrp: product.price,
                    unitFinal: product.price * (1 - product.customerDiscount / 100),
                    unitFinalPriceAfterPromoterDiscount: priceDetails.finalPriceAfterPromoterDiscount
                }
            });
        }
        return items;
    }

    // Get products with filters and pagination
    const getProductsData = async (initialLoad = false) => {
        try {
            setLoading(true);
            
            // If it's the initial load, just get featured products
            if (initialLoad) {
                // Use the new user-specific endpoint
                const featuredResponse = await axios.post(backendUrl + '/api/product/user/list', {
                    limit: 10,
                    bestseller: true,
                    sortBy: 'date',
                    sortOrder: 'desc'
                });
                
                if (featuredResponse.data.success) {
                    setFeaturedProducts(featuredResponse.data.products);
                }
                setLoading(false);
                return;
            }
            
            // For regular page loads, use filters and pagination
            // Use the new user-specific endpoint
            const response = await axios.post(backendUrl + '/api/product/user/list', {
                page: productsPagination.currentPage,
                limit: productsPagination.limit,
                ...filters,
                search: filters.search || search // Use either direct search or from filters
            });
            
            if (response.data.success) {
                setProducts(response.data.products);
                setProductsPagination({
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages,
                    currentPage: response.data.pagination.currentPage,
                    limit: response.data.pagination.limit
                });
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Get a specific product by ID
    const getProductById = async (productId) => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/product/${productId}`);
            if (response.data.success) {
                return response.data.product;
            } else {
                toast.error(response.data.message);
                return null;
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }

    // Get related products
    const getRelatedProducts = async (category, subCategory, excludeId, limit = 5) => {
        try {
            setLoading(true);
            // Use the new user-specific endpoint
            const response = await axios.post(backendUrl + '/api/product/user/list', {
                category,
                subCategory,
                excludeId,
                limit,
                sortBy: 'date',
                sortOrder: 'desc'
            });
            
            if (response.data.success) {
                return response.data.products;
            } else {
                return [];
            }
        } catch (error) {
            console.log(error);
            return [];
        } finally {
            setLoading(false);
        }
    }

    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, {headers:{token}});
            if (response.data.success) {
                // Make sure we're setting the complete cart data structure
                const cartData = response.data.cartData || {};
                
                // Validate the structure of each cart item
                Object.entries(cartData).forEach(([itemId, item]) => {
                    // Skip null or undefined items
                    if (item === null || item === undefined) {
                        delete cartData[itemId];
                        return;
                    }
                    
                    // If the item is in old format (just a number), convert it to new format
                    if (typeof item === 'number') {
                        cartData[itemId] = {
                            quantity: item,
                            selectedPrice: null,
                            isPackage: false
                        };
                    } 
                    // If the item exists but has missing properties, ensure they exist
                    else if (typeof item === 'object') {
                        if (!Object.prototype.hasOwnProperty.call(item, 'quantity')) item.quantity = 1;
                        if (!Object.prototype.hasOwnProperty.call(item, 'selectedPrice')) item.selectedPrice = null;
                        if (!Object.prototype.hasOwnProperty.call(item, 'isPackage')) item.isPackage = false;
                    }
                });
                
                setCartItem(cartData);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }

    useEffect(() => {
        // On initial load, fetch featured products
        getProductsData(true);
    }, []);

    // Listen for changes in filters and pagination to fetch products
    useEffect(() => {
        if (showSearch || (filters.category.length > 0) || (filters.subCategory.length > 0) || 
            filters.search || productsPagination.currentPage > 1) {
            getProductsData();
        }
    }, [filters, productsPagination.currentPage, showSearch]);

    // Apply search when search box is used
    useEffect(() => {
        if (showSearch) {
            updateFilters({ search });
        }
    }, [search, showSearch]);

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'));
            getUserCart(localStorage.getItem('token'));
        }
    }, []);

    const value = {
        products, featuredProducts, loading, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItem,
        getCartCount, updateQuantity,
        getCartAmount, navigate, backendUrl,
        setToken, token, getCartItems, getItemTotal,
        filters, updateFilters, 
        pagination: productsPagination,
        setPage,
        getProductById,
        getRelatedProducts,
        getTypeOfProductsAddedInCart
    }

    return(
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

ShopContextProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default ShopContextProvider;

