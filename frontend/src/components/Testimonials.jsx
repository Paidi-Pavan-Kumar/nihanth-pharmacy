import { Star } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Regular Customer",
      image: "https://randomuser.me/api/portraits/women/32.jpg",
      stars: 5,
      text: "Nihanth Pharmacy has been a lifesaver for me. Their quick delivery and genuine medicines have made managing my health so much easier. The online ordering process is seamless!"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Monthly Subscriber",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
      stars: 5,
      text: "I appreciate the consistency and reliability of Nihanth Pharmacy. Their subscription service ensures I never run out of my regular medications, and their customer support is excellent."
    },
    {
      id: 3,
      name: "Priya Patel",
      role: "Healthcare Professional",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      stars: 4,
      text: "As a healthcare worker, I'm particular about medicine quality. Nihanth consistently delivers authentic products and their service is prompt and professional. Highly recommended!"
    },
    {
      id: 4,
      name: "David Wilson",
      role: "First-time Customer",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      stars: 5,
      text: "I was skeptical about ordering medicines online, but Nihanth Pharmacy exceeded my expectations. The medications arrived on time and were exactly what I needed. Will definitely use again!"
    },
    {
      id: 5,
      name: "Anita Sharma",
      role: "Senior Citizen",
      image: "https://randomuser.me/api/portraits/women/56.jpg",
      stars: 5,
      text: "The home delivery service from Nihanth Pharmacy is a blessing for seniors like me. The delivery staff is courteous, and the medicine packages are sealed properly. Very satisfied!"
    }
  ];

  return (
    <section className="py-16 dark:bg-gray-800">
      <div className="container">
        <div className="text-center mb-12">
          <span className="bg-secondary dark:bg-gray-700 text-primary dark:text-green-300 px-4 py-1 rounded-full text-sm font-medium">
            Customer Feedback
          </span>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-semibold text-primary dark:text-[#02ADEE]">
            What Our Customers Say
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            Read testimonials from our satisfied customers who trust Nihanth Pharmacy for their healthcare needs.
          </p>
        </div>
        
        <div className="mt-12">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true
            }}
            breakpoints={{
              640: {
                slidesPerView: 1,
              },
              768: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
          >
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <div 
                  className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md flex flex-col h-full mx-2 mb-8"
                >
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary dark:border-[#02ADEE]"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">{testimonial.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        size={18} 
                        className={`${i < testimonial.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 flex-grow">{testimonial.text}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 