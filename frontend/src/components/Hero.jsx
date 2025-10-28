import { ChevronLeft, ChevronRight } from "lucide-react";
import { assets } from "../assets/assets";
import { useState, useEffect } from "react";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const sliderImages = [assets.image3, assets.image1, assets.image2];

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  // Functions to navigate through slides
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + sliderImages.length) % sliderImages.length
    );
  };

  return (
    <div className="flex flex-col sm:flex-row dark:bg-gray-800">
      <section className="pt-12 pb-12 container pr-0 pl-0 pb-0">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div
            className="flex-1 relative animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Image slider container */}
            <div className="relative h-[300px] w-full rounded-2xl overflow-hidden shadow-xl">
              {/* Static Image Backup (will show if slider fails) */}
              <img
                src={sliderImages[0]}
                alt="Healthcare Default"
                className="w-full h-full object-cover rounded-2xl"
                width="800"
                height="600"
              />

              {/* Images - using a different approach with regular display instead of absolute positioning */}
              <div className="absolute inset-0 w-full h-full">
                {sliderImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                      index === currentSlide
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Healthcare Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                      width="800"
                      height="600"
                    />
                  </div>
                ))}
              </div>

              {/* Navigation buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft
                  size={20}
                  className="text-primary dark:text-green-300"
                />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight
                  size={20}
                  className="text-primary dark:text-green-300"
                />
              </button>

              {/* Indicator dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                {sliderImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlide
                        ? "bg-primary dark:bg-green-300"
                        : "bg-white/50 dark:bg-gray-600"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
