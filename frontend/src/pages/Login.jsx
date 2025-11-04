import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowRight } from 'lucide-react';

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);
  
  // Existing state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Add state for forgot password form
  const [forgotPasswordData, setForgotPasswordData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      if (currentState === 'Sign up') {
        const response = await axios.post(backendUrl + '/api/user/register', {
          name, 
          email,
          phoneNumber,
          password
        })

        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
          toast.success('Account created successfully!')
        } else {
          toast.error(response.data.message)
        }
      } else {
        const response = await axios.post(backendUrl + '/api/user/login', {
          phoneNumber,
          password
        })

        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
          toast.success('Welcome back!')
        } else {
          toast.error(response.data.message)
        }
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Handle forgot password form submission
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(backendUrl + '/api/contact/submit', {
        ...forgotPasswordData,
        message: `Password reset request. Phone: ${forgotPasswordData.phone}`
      });

      if (response.data.success) {
        toast.success('Password reset request sent! Our team will contact you shortly.');
        setShowForgotPassword(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to send password reset request');
    }
  };

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        {!showForgotPassword ? (
          <>
            {/* Existing login/signup form */}
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {currentState === 'Login' ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {currentState === 'Login' 
                  ? "Sign in to access Online Medicine" 
                  : "Join us for Online Medicine & Healthcare Partner"}
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={onSubmitHandler}>
              <div className="rounded-md shadow-sm space-y-4">
                {currentState === 'Sign up' && (
                  <>
                    <div>
                      <label htmlFor="name" className="sr-only">Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="sr-only">Email address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="Email address"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                    placeholder="Phone Number (10 digits)"
                    maxLength="10"
                    pattern="[0-9]{10}"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {currentState === 'Login' ? (
                    <button
                      type="button"
                      onClick={() => setCurrentState('Sign up')}
                      className="font-medium text-primary hover:text-primary-dark"
                    >
                      Create new account
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentState('Login')}
                      className="font-medium text-primary hover:text-primary-dark"
                    >
                      Already have an account?
                    </button>
                  )}
                </div>
                {currentState === 'Login' && (
                  <div className="text-sm">
                    <button 
                      onClick={() => setShowForgotPassword(true)}
                      className="font-medium text-primary hover:text-primary-dark"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <ArrowRight className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                  {currentState === 'Login' ? 'Sign in' : 'Create Account'}
                </button>
              </div>
            </form>
          </>
        ) : (
          // Forgot Password Form
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Fill in your details and we'll help you reset your password
            </p>
            <form onSubmit={handleForgotPassword} className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    value={forgotPasswordData.name}
                    onChange={(e) => setForgotPasswordData({
                      ...forgotPasswordData,
                      name: e.target.value
                    })}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    value={forgotPasswordData.email}
                    onChange={(e) => setForgotPasswordData({
                      ...forgotPasswordData,
                      email: e.target.value
                    })}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    value={forgotPasswordData.phone}
                    onChange={(e) => setForgotPasswordData({
                      ...forgotPasswordData,
                      phone: e.target.value
                    })}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Phone Number"
                    maxLength="10"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="font-medium text-primary hover:text-primary-dark"
                >
                  Back to Login
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <ArrowRight className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                  Submit Reset Request
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
