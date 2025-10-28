import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, User, Loader2 } from 'lucide-react';
import { ShopContext } from "../context/ShopContext";
import Navbar from '../components/Navbar';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0
  });
  const navigate = useNavigate();
  const { backendUrl } = useContext(ShopContext);

  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/blog/list?page=${page}&limit=9`);
      const data = await response.json();
      
      if (data.success) {
        setBlogs(data.blogs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    window.scrollTo(0, 0);
  }, []);

  const handlePageChange = (page) => {
    fetchBlogs(page);
    window.scrollTo(0, 0);
  };

  const truncateContent = (content, maxLength = 150) => {
    // Remove HTML tags
    const textContent = content.replace(/<[^>]*>/g, '');
    
    if (textContent.length <= maxLength) return textContent;
    
    return textContent.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-900 dark:text-white">Our Blog</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto mb-12">
          Stay updated with the latest health news, medical insights, and useful information on pharmaceuticals and wellness.
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin mr-2" size={30} />
            <span className="text-lg text-gray-700 dark:text-gray-300">Loading blogs...</span>
          </div>
        ) : (
          <>
            {blogs.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg text-gray-600 dark:text-gray-400">No blog posts available at the moment.</p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">Please check back later for new content.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <div 
                    key={blog._id} 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/blog/${blog._id}`)}
                  >
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={blog.image} 
                        alt={blog.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center mr-4">
                          <Calendar size={14} className="mr-1" />
                          <span>{formatDate(blog.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <User size={14} className="mr-1" />
                          <span>{blog.author}</span>
                        </div>
                      </div>
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white">{blog.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {truncateContent(blog.content)}
                      </p>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                        Read More
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`mr-2 p-2 rounded-md ${
                      pagination.currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-md ${
                          pagination.currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`ml-2 p-2 rounded-md ${
                      pagination.currentPage === pagination.totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ChevronRight size={20} className="text-gray-700 dark:text-gray-300" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Blogs; 