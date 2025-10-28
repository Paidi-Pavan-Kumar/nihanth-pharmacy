import Hero from '../components/Hero'
import BestSeller from '../components/BestSeller'
import NewsLetterBox from '../components/NewsLetterBox'
import Feature from '../components/Feature'
import Testimonials from '../components/Testimonials'

const Home = () => {
  return (
    <div>
      <Hero />
      <BestSeller />
      <Testimonials />
      <Feature />
      <NewsLetterBox />
    </div>
  )
}

export default Home
