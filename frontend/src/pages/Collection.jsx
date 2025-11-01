import { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingCart, Loader2, X } from 'lucide-react';

const Collection = () => {
  const { 
    products, 
    search, 
    loading, 
    pagination, 
    setPage, 
    filters, 
    updateFilters 
  } = useContext(ShopContext);
  
  const [showFilter, setShowFilter] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [subCategoryFilters, setSubCategoryFilters] = useState([]);
  const [sortOption, setSortOption] = useState('relevant');
  const [initialized, setInitialized] = useState(false);
  
  // Initialize filter states from context when component mounts or filters change
  useEffect(() => {
    if (filters.category && Array.isArray(filters.category)) {
      setCategoryFilters(filters.category);
    }
    
    if (filters.subCategory && Array.isArray(filters.subCategory)) {
      setSubCategoryFilters(filters.subCategory);
    }
    
    // Set sort option based on current filters
    if (filters.sortBy === 'price') {
      setSortOption(filters.sortOrder === 'asc' ? 'low-high' : 'high-low');
    } else {
      setSortOption('relevant');
    }
  }, [filters]);
  
  // Fetch initial products only once when component mounts
  useEffect(() => {
    if (!initialized) {
      // Preserve any existing search from context instead of clearing it
      updateFilters({ 
        category: [],
        subCategory: [],
        sortBy: 'date',
        sortOrder: 'desc',
        search: search || ''    // <--- changed to preserve context search
      });
      setInitialized(true);
    }
  }, [initialized, updateFilters, search]);
  
  const handleCategoryToggle = (value) => {
    let newCategories;
    
    if (categoryFilters.includes(value)) {
      newCategories = categoryFilters.filter(item => item !== value);
    } else {
      newCategories = [...categoryFilters, value];
    }
    
    setCategoryFilters(newCategories);
    updateFilters({ category: newCategories });
  };
  
  const handleSubCategoryToggle = (value) => {
    let newSubCategories;
    
    if (subCategoryFilters.includes(value)) {
      newSubCategories = subCategoryFilters.filter(item => item !== value);
    } else {
      newSubCategories = [...subCategoryFilters, value];
    }
    
    setSubCategoryFilters(newSubCategories);
    updateFilters({ subCategory: newSubCategories });
  };
  
  const handleSortChange = (value) => {
    setSortOption(value);
    
    switch(value) {
      case 'low-high':
        updateFilters({ sortBy: 'price', sortOrder: 'asc' });
        break;
      case 'high-low':
        updateFilters({ sortBy: 'price', sortOrder: 'desc' });
        break;
      default:
        updateFilters({ sortBy: 'date', sortOrder: 'desc' });
        break;
    }
  };
  
  const clearAllFilters = () => {
    setCategoryFilters([]);
    setSubCategoryFilters([]);
    setSortOption('relevant');
    updateFilters({ 
      category: [], 
      subCategory: [], 
      sortBy: 'date', 
      sortOrder: 'desc',
      search: ''
    });
  };
  
  // Function to render pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = 1;
    let endPage = pagination.pages;
    
    if (pagination.pages > maxVisibleButtons) {
      // Calculate start and end page numbers
      const halfVisibleButtons = Math.floor(maxVisibleButtons / 2);
      
      if (pagination.currentPage <= halfVisibleButtons) {
        // Near the start
        endPage = maxVisibleButtons;
      } else if (pagination.currentPage >= pagination.pages - halfVisibleButtons) {
        // Near the end
        startPage = pagination.pages - maxVisibleButtons + 1;
      } else {
        // In the middle
        startPage = pagination.currentPage - halfVisibleButtons;
        endPage = pagination.currentPage + halfVisibleButtons;
      }
    }
    
    // Add ellipsis at the beginning if needed
    if (startPage > 1) {
      buttons.push(
        <button
          key="start"
          onClick={() => setPage(1)}
          className="w-8 h-8 rounded bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis-start" className="text-gray-500 dark:text-gray-400 mx-1">...</span>
        );
      }
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`w-8 h-8 rounded ${
            pagination.currentPage === i
              ? 'bg-black text-white dark:bg-[#02ADEE] dark:text-gray-800'
              : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis at the end if needed
    if (endPage < pagination.pages) {
      if (endPage < pagination.pages - 1) {
        buttons.push(
          <span key="ellipsis-end" className="text-gray-500 dark:text-gray-400 mx-1">...</span>
        );
      }
      
      buttons.push(
        <button
          key="end"
          onClick={() => setPage(pagination.pages)}
          className="w-8 h-8 rounded bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200"
        >
          {pagination.pages}
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t dark:border-gray-700 dark:bg-gray-800'>
      {/* Filter Section */}
      <div className='min-w-60'>
        {/* <div className="flex items-center justify-between mb-4">
          <p onClick={() => setShowFilter(!showFilter)} className='text-xl flex items-center cursor-pointer gap-2 dark:text-gray-200'>
            FILTERS
            <img
              className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''} dark:invert`}
              src={assets.dropdown_icon}
              alt=""
            />
          </p>
          
          <button 
            onClick={clearAllFilters}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 flex items-center gap-1"
          >
            <X size={14} /> Clear All
          </button>
        </div> */}
        
        {/* Active filters display */}
        {(categoryFilters.length > 0 || subCategoryFilters.length > 0 || search) && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2 dark:text-gray-300">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map(cat => (
                <span 
                  key={cat} 
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full flex items-center gap-1 dark:text-gray-200"
                >
                  {cat}
                  <button 
                    onClick={() => handleCategoryToggle(cat)}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              
              {subCategoryFilters.map(subCat => (
                <span 
                  key={subCat} 
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full flex items-center gap-1 dark:text-gray-200"
                >
                  {subCat}
                  <button 
                    onClick={() => handleSubCategoryToggle(subCat)}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              
              {search && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full flex items-center gap-1 dark:text-gray-200">
                  Search: {search}
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="hidden" aria-hidden="true" />

        {/* Type filter - hidden */}
        <div className="hidden" aria-hidden="true" />
      </div>

      {/* Products Section */}
      <div className='flex-1'>
        <div className='flex justify-between items-center text-base sm:text-2xl mb-4'>
          <Title text1={'ALL'} text2={'PRODUCTS'} />

          <div className="relative inline-block">
            <select 
              onChange={(e) => handleSortChange(e.target.value)} 
              value={sortOption}
              aria-label="Sort products"
              className="appearance-none pl-3 pr-10 py-2 h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#02ADEE] focus:border-[#02ADEE] transition-colors"
            >
              <option value="relevant">Sort by: relevant</option>
              <option value="low-high">Sort by: Price low to high</option>
              <option value="high-low">Sort by: Price high to low</option>
            </select>

            {/* custom arrow */}
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L10 9.586l3.293-3.293a1 1 0 011.414 1.414l-4 4A1 1 0 0110 12z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-gray-500 dark:text-gray-300" />
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="text-center p-10 text-gray-500 dark:text-gray-300">
                No products found matching your criteria.
              </div>
            ) : (
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
                {products.map((item) => (
                  <div key={item._id} className="flex flex-col items-center">
                  <ProductItem 
                    key={item._id} 
                    id={item._id} 
                    name={item.name} 
                    price={item.price} 
                    image={item.image}
                    customerDiscount={item.customerDiscount}
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
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center mt-10 mb-6 space-x-2">
                <button 
                  onClick={() => setPage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="p-2 border rounded mr-2 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {renderPaginationButtons()}
                </div>
                
                <button 
                  onClick={() => setPage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.pages}
                  className="p-2 border rounded ml-2 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Results Summary */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4 mb-8">
              Showing {products.length > 0 ? ((pagination.currentPage - 1) * pagination.limit) + 1 : 0} - {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of {pagination.total} products
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Collection;
