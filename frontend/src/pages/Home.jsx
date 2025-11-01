import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, UserRound, Search, Pill } from 'lucide-react'
import { ShopContext } from '../context/ShopContext'
import Hero from '../components/Hero'
import SearchBar from '../components/SearchBar'
import BestSeller from '../components/BestSeller'
import NewsLetterBox from '../components/NewsLetterBox'
import Feature from '../components/Feature'
import { Link } from 'react-router-dom'
const ServiceCard = ({ icon: Icon, title, description, to }) => (
  <Link 
    to={to}
    className="flex-1 min-w-[250px] p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow group"
  >
    <div className="w-14 h-14 rounded-full bg-[#02ADEE]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="w-7 h-7 text-[#02ADEE]" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
  </Link>
);


const Home = () => {
  return (
    <div>

      <Hero />
      
      
      {/* Service Cards Section */}
      <div className="px-4 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Our Services
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 max-w-3xl mx-auto">
            <ServiceCard
              icon={Pill}
              title="Search Medicines"
              description="Find and order genuine medicines from our wide range of products"
              to="/products"
            />
            <ServiceCard
              icon={FileText}
              title="Upload Prescription"
              description="Get medicines delivered by uploading your prescription"
              to="/upload-prescription"
            />
            <ServiceCard
              icon={UserRound}
              title="Consult Doctor"
              description="Book online consultations with experienced doctors"
              to="/consult-doctor"
            />
          </div>
        </div>
      </div>

      <Feature />
      <NewsLetterBox />
    </div>
  )
}

export default Home
