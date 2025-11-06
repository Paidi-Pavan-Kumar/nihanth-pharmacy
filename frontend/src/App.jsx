import {Routes, Route} from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Collection from './pages/Collection'
import About from './pages/About'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import PlaceOrder from './pages/PlaceOrder'
import GuestCheckout from './pages/GuestCheckout'
import Orders from './pages/Orders'
import Blogs from './pages/Blogs'
import BlogDetail from './pages/BlogDetail'
import NavBar from './components/Navbar'
import WhatsAppButton from './components/WhatsAppButton'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import { ToastContainer } from 'react-toastify';
import Verify from './pages/Verify'
import Policy from './pages/Policy'
import UploadPrescription from './pages/UploadPrescription'
import ConsultDoctor from './pages/ConsultDoctor'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'


const App = () => {
  const location = useLocation();

  const showSearchBar =
    location.pathname === '/' ||
    location.pathname.startsWith('/products');

  return (
    <div className='min-h-screen flex flex-col bg-white dark:bg-gray-800 transition-colors font-sans'>
      <ScrollToTop />
      <ToastContainer position='bottom-right' autoClose={2000} />
      
      {/* Fixed navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
        <NavBar />
      </div>

      {/* Main content */}
      <div className='flex-grow'>
        {/* Search bar with gap */}
        {showSearchBar && (
          <div className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-gray-800">
            <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] py-4 mt-2">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Main content with adjusted padding */}
        <div className={`px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] ${showSearchBar ? 'pt-36' : 'pt-20'}`}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/products' element={<Collection />} />
            <Route path='/about' element={<About />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/product/:productId' element={<Product />} />
            <Route path='/cart' element={<Cart />} />
            <Route path = "/upload-prescription" element={<UploadPrescription />} />
            <Route path = "/consult-doctor" element={<ConsultDoctor />} />
            <Route path = '/login' element={<Login />} />
            <Route path = '/place-order' element={<PlaceOrder />} />
            <Route path = '//guest-checkout' element={<GuestCheckout />} />
            <Route path = '/orders' element={<Orders />} />
            <Route path = '/verify' element={<Verify />} />
            <Route path = '/policy' element={<Policy />} />
            <Route path = '/blogs' element={<Blogs />} />
            <Route path = '/blog/:id' element={<BlogDetail />} />
            <Route path = '/wallet' element={<Wallet />} />
            <Route path = '/profile' element={<Profile />} />
          </Routes>
        </div>
      </div>

      <div className='fixed bottom-4 right-4 z-40'>
        <WhatsAppButton />
      </div>
      <Footer />
    </div>
  )
}

export default App
