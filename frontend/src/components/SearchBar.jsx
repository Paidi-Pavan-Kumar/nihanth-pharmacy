import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { Search, X } from 'lucide-react'

const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch, updateFilters } = useContext(ShopContext);
  const [searchInput, setSearchInput] = useState(search);
  const navigate = useNavigate();
  
  const handleSearch = () => {
    setSearch(searchInput);
    updateFilters({ search: searchInput });
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchInput('');
    setSearch('');
    updateFilters({ search: '' });
  };
  
  if (!showSearch) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-50 bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="relative flex items-center">
          {/* Search Input */}
          <input 
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              // navigate to products page even if input is empty when focused
              navigate('/products');
            }}
            placeholder="Search medicines, healthcare products..."
            className="w-full h-11 pl-4 pr-20 rounded-lg 
                     border-2 border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400
                     text-sm sm:text-base
                     focus:outline-none focus:border-[#02ADEE] 
                     dark:focus:border-[#02ADEE] transition-colors"
          />

          {/* Action Buttons */}
          <div className="absolute right-2 flex items-center gap-1">
            {searchInput && (
              <button 
                onClick={handleClear}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                         rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
            
            <button 
              onClick={handleSearch}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                       rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-[#02ADEE]" />
            </button>
          </div>
        </div>

        {/* Close Bar Button
        <button
          onClick={handleClose}
          className="absolute right-4 -bottom-10 
                   px-3 py-1 text-xs sm:text-sm
                   bg-gray-100 dark:bg-gray-700
                   text-gray-600 dark:text-gray-300
                   rounded-b-lg shadow-sm
                   hover:bg-gray-200 dark:hover:bg-gray-600
                   transition-colors"
        >
          Close
        </button> */}
      </div>
    </div>
  );
}

export default SearchBar
