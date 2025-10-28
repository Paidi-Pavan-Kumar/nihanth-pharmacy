import Title from '../components/Title'
import NewsLetterBox from '../components/NewsLetterBox'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div className="dark:bg-gray-800">
    <div className='text-2xl text-center pt-8 border-t dark:border-gray-700'>
      <Title text1={'ABOUT'} text2={'US'} />
    </div>

    <div className='my-10 flex flex-col md:flex-row gap-16'>
      <img 
        src={assets.about} 
        className='w-full md:max-w-[450px] rounded-2xl' 
        alt='Online Medicine Delivery' 
        loading='eager' 
        width='450' 
        height='338' 
        fetchpriority='high' 
        sizes='(max-width: 768px) 100vw, 450px' 
      />
      <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600 dark:text-gray-300'>
        <p>Welcome to Nihanth Pharmacy, your trusted online Pharmacy! We provide a seamless way to order medicines online, ensuring you receive your essential medications quickly and hassle-free. At Nihanth Pharmacy, we prioritize your health by delivering genuine and high-quality medicines right to your doorstep.</p>
        <p>Our team works with certified pharmacies and licensed suppliers to bring you a wide range of medicines, wellness products, and healthcare essentials. Whether it's prescription medicines, over-the-counter drugs, or health supplements, we ensure safe and reliable delivery.</p>
        <b className='text-gray-800 dark:text-gray-100'>Our Mission</b>
        <p>At Nihanth Pharmacy, we are committed to making healthcare accessible and convenient. Our mission is to provide a trusted and efficient medicine delivery service, ensuring that everyone has access to the right medication at the right time. We bridge the gap between healthcare providers and patients through technology-driven solutions.</p>
      </div>
    </div>

    <div className='text-xl py-4'>
      <Title text1={'WHY'} text2={'CHOOSE US'} />
    </div>
    <div className='flex flex-col md:flex-row text-sm mb-20'>
      <div className='border dark:border-gray-700 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 hover:bg-gray-50 dark:hover:bg-gray-700'>
        <b className="dark:text-gray-100">Authentic Medicines</b>
        <p className='text-gray-600 dark:text-gray-300'>We source medicines only from certified pharmacies and licensed suppliers, ensuring 100% authenticity and quality. Your health and safety are our top priorities.</p>
      </div>

      <div className='border dark:border-gray-700 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 hover:bg-gray-50 dark:hover:bg-gray-700'>
        <b className="dark:text-gray-100">Fast & Reliable Delivery</b>
        <p className='text-gray-600 dark:text-gray-300'>Order your medicines with ease and get them delivered quickly. We offer same-day and next-day delivery options to ensure you receive your medication on time.</p>
      </div>

      <div className='border dark:border-gray-700 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 hover:bg-gray-50 dark:hover:bg-gray-700'>
        <b className="dark:text-gray-100">Secure & Easy Ordering</b>
        <p className='text-gray-600 dark:text-gray-300'>Our platform offers a user-friendly experience, allowing you to upload prescriptions, track orders, and get doorstep delivery effortlessly.</p>
      </div>        
    </div>
    
    <NewsLetterBox />
  </div>
  )
}

export default About
