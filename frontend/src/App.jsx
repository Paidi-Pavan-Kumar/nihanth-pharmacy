import {Routes, Route} from 'react-router-dom'
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


const App = () => {
  return(
    <div className='bg-white dark:bg-gray-800 transition-colors font-sans'>
      <ScrollToTop/>
      <ToastContainer position='bottom-right' autoClose={2000} />
      <NavBar />
      <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] pt-20'>
        <SearchBar />
        <Routes>
          <Route path = '/' element = {<Home/>}/>
          <Route path = '/products' element = {<Collection/>}/>
          <Route path = '/about' element = {<About/>}/>
          <Route path = '/contact' element = {<Contact/>}/>
          <Route path = '/product/:productId' element = {<Product/>}/>
          <Route path = '/cart' element = {<Cart/>}/>
          <Route path = '/login' element = {<Login/>}/>
          <Route path = '/place-order' element = {<PlaceOrder/>}/>
          <Route path = '//guest-checkout' element = {<GuestCheckout/>}/>
          <Route path = '/orders' element = {<Orders/>}/>
          <Route path = '/verify' element = {<Verify/>}/>
          <Route path = '/policy' element = {<Policy/>}/>
          <Route path = '/blogs' element = {<Blogs/>}/>
          <Route path = '/blog/:id' element = {<BlogDetail/>}/>
        </Routes>
      </div>
      <div className='fixed bottom-4 right-4'>
        <WhatsAppButton />
      </div>
      <Footer />
    </div>
  )
}

export default App
