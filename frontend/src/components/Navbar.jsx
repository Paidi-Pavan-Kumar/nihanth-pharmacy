import { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import ThemeSwitcher from './ThemeSwitcher';

const NavBar = () => {
    const [visible, setVisible] = useState(false);
    const { setShowSearch, getTypeOfProductsAddedInCart, navigate, token, setToken, setCartItems } = useContext(ShopContext);
    
    const logout = () => {
        navigate('/login');
        localStorage.removeItem('token');
        setToken('');
        setCartItems({});
    }

    return (
        <div className='flex items-center justify-between py-4 px-3 sm:px-5 font-medium bg-[#7ccfff] dark:bg-gray-900 shadow-md fixed top-0 left-0 right-0 z-50 transition-colors'>
            <Link to="/" className="font-display text-primary dark:text-[#02ADEE]">
                <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-xl md:text-2xl whitespace-nowrap">Nihanth Pharma</span>
                </div>
            </Link>

            <ul className='hidden sm:flex gap-3 md:gap-7 text-sm text-gray-700 dark:text-gray-200'>
                <NavLink to='/' className='flex flex-col items-center gap-1 hover:text-primary dark:hover:text-[#02ADEE]'>
                    <p>HOME</p>
                </NavLink>

                <NavLink to='/products' className='flex flex-col items-center gap-1 hover:text-primary dark:hover:text-[#02ADEE]'>
                    <p>PRODUCTS</p>
                </NavLink>

                <NavLink to='/orders' className='flex flex-col items-center gap-1 hover:text-primary dark:hover:text-[#02ADEE]'>
                    <p>ORDER</p>
                </NavLink>

                <NavLink to='/contact' className='flex flex-col items-center gap-1 hover:text-primary dark:hover:text-[#02ADEE]'>
                    <p>CONTACT</p>
                </NavLink>
            </ul>

            {/* Right side - ensure icons remain visible on mobile */}
            <div className='flex items-center gap-2 sm:gap-4 md:gap-6 text-gray-700 dark:text-gray-200'>
                {/* <ThemeSwitcher /> */}

                <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                    <img 
                        onClick={() => { setShowSearch(true); navigate('/products') }} 
                        src={assets.search_icon} 
                        className='w-5 cursor-pointer dark:invert' 
                        alt="search"
                    />

                    {/* profile icon - make slightly larger and always visible on mobile */}
                    <div className='group relative'>
                        <img 
                            onClick={() => token ? null : navigate('/login')} 
                            src={assets.profile_icon} 
                            className='w-6 sm:w-5 cursor-pointer dark:invert z-40' 
                            alt="profile"
                        />
                        {token &&
                            <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-50'>
                                <div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded shadow-lg'>
                                    <p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-black dark:hover:text-white'>Orders</p>
                                    <p onClick={logout} className='cursor-pointer hover:text-black dark:hover:text-white'>Log-Out</p>
                                </div>
                            </div>}
                    </div>

                    <Link to='/cart' className='relative'>
                        <img src={assets.cart_icon} className='w-5 min-w-5 dark:invert' alt="cart" />
                        <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black dark:bg-white text-white dark:text-black aspect-square rounded-full text-[8px]'>
                            {getTypeOfProductsAddedInCart()}
                        </p>
                    </Link>
                </div>

                {/* removed separate Login/Signup/Logout button from header - auth handled in menu */}
                {/* Mobile menu button - keep last so icons remain visible */}
                <img onClick={() => setVisible(true)} src={assets.menu_icon} className='w-5 cursor-pointer sm:hidden dark:invert ml-1' alt="menu"></img>
            </div>

            {/* Slide-out mobile menu */}
            <div className={`fixed top-0 right-0 bottom-0 z-50 overflow-auto bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${visible ? 'w-full sm:w-64' : 'w-0 pointer-events-none'}`}>
                <div className='flex flex-col text-gray-600 dark:text-gray-300'>
                    <div className='flex items-center justify-between p-3'>
                        <div onClick={() => setVisible(false)} className='flex items-center gap-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 py-2 px-2 rounded'>
                            <img className='h-4 rotate-180 dark:invert' src={assets.dropdown_icon} alt="back" />
                            <p>Back</p>
                        </div>
                        {/* Auth actions moved fully into the menu */}
                        {token ? (
                            <button onClick={() => { logout(); setVisible(false); }} className='text-sm bg-red-500 text-white py-1 px-3 rounded'>Logout</button>
                        ) : (
                            <div className='flex gap-2'>
                                <button onClick={() => { navigate('/login'); setVisible(false); }} className='text-sm bg-primary text-white py-1 px-3 rounded'>Login/Signup</button>
                            </div>
                        )}
                    </div>

                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800' to='/'>HOME</NavLink>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800' to='/products'>PRODUCTS</NavLink>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800' to='/orders'>ORDER</NavLink>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800' to='/contact'>CONTACT</NavLink>
                </div>
            </div>
        </div>
    )
}

export default NavBar