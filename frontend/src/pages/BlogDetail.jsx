import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShopContext } from "../context/ShopContext";
import { Calendar, User, ArrowLeft, Loader2 } from 'lucide-react';

const BlogDetail = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const { backendUrl } = useContext(ShopContext);

  useEffect(() => {
    const fetchBlogDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/api/blog/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setBlog(data.blog);
        } else {
          setError(data.message || 'Failed to fetch blog');
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
        setError('An error occurred while fetching the blog');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin mr-2" size={30} />
            <span className="text-lg text-gray-700 dark:text-gray-300">Loading blog post...</span>
          </div>
        </div>
    );
  }

  if (error || !blog) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Blog Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
            <Link to="/blogs" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              <ArrowLeft size={18} className="mr-2" />
              Back to All Blogs
            </Link>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/blogs" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-8">
          <ArrowLeft size={18} className="mr-2" />
          Back to All Blogs
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="h-80 overflow-hidden">
            <img 
              src={blog.image} 
              alt={blog.title} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{blog.title}</h1>
            
            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-6">
              <div className="flex items-center mr-6">
                <User size={18} className="mr-2" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={18} className="mr-2" />
                <span>{formatDate(blog.createdAt)}</span>
              </div>
            </div>

            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>
        </div>
      </div>
  );
};

export default BlogDetail; 