import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

const heroImages = [
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/00ey4ncl_naked-black-4664328_1920.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/fj5i5ykc_naked-black-4666070_1280.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/xr4hlq21_naked-black-4666073_1280.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/xj5hx5hs_naked-black-4666075_1280.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/ec6svrzi_naked-black-4666076_1280.jpg",
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const totalSlides = heroImages.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section ref={sectionRef} id="home" className="relative h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Background Images Slider */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover object-center"
            />
          </div>
        ))}
        
        {/* Lighter gradient overlays - more visible background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/80 via-transparent to-[#0a0a0f]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]/90" />
        {/* Subtle purple tint */}
        <div className="absolute inset-0 bg-purple-900/10 mix-blend-overlay" />
      </div>

      {/* Subtle Gradient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/10 rounded-full blur-[150px] md:blur-[200px]" />
        {/* Bottom mist effect */}
        <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-purple-900/20 to-transparent" />
      </div>

      {/* Main Content - Centered */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center z-10 max-w-4xl px-4">
          <p 
            className={`text-fuchsia-400 tracking-[0.2em] md:tracking-[0.3em] uppercase text-xs md:text-sm font-semibold mb-4 md:mb-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '0.2s' }}
          >
            Meet Your Newest <span className="text-fuchsia-300">Elite Escort</span>
          </p>
          
          <h1 
            className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white leading-[0.9] tracking-tight mb-6 md:mb-8 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.4s', fontFamily: "'Playfair', serif" }}
          >
            <span className="block">HAVE YOU</span>
            <span className="block">NEGOTIATE?</span>
          </h1>

          <p 
            className={`text-gray-300 text-base md:text-lg lg:text-xl max-w-md md:max-w-xl mx-auto leading-relaxed mb-8 md:mb-10 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '0.6s' }}
          >
            Refined, flirtatious, and habit‑forming. One evening together won't be enough.
          </p>

          <div
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '0.8s' }}
          >
            <Button 
              className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-bold px-8 md:px-10 py-5 md:py-6 rounded-full text-sm md:text-base shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:shadow-fuchsia-500/50 hover:scale-105 active:scale-95"
            >
              Negotiate
            </Button>
          </div>
        </div>
      </div>

      {/* Slider Indicator - Fixed at Bottom Left */}
      <div className="absolute bottom-6 md:bottom-8 left-4 md:left-8 flex items-center gap-2 md:gap-3 z-20">
        <span className="text-white font-semibold text-xs md:text-sm">
          {String(currentSlide + 1).padStart(2, '0')}
        </span>
        <div className="w-16 md:w-28 h-[2px] bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
        </div>
        <span className="text-gray-500 text-xs md:text-sm">
          {String(totalSlides).padStart(2, '0')}
        </span>
      </div>

      {/* Navigation Arrows - Fixed at Bottom Right */}
      <div className="absolute bottom-6 md:bottom-8 right-4 md:right-8 flex gap-2 z-20">
        <button 
          onClick={prevSlide}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all duration-300 bg-white/5 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button 
          onClick={nextSlide}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all duration-300 bg-gradient-to-r from-blue-500/20 to-purple-500/20 active:scale-95"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Slide Dots Indicator - Center Bottom (Hidden on mobile) */}
      <div className="hidden sm:flex absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 gap-2 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-fuchsia-500 w-6' 
                : 'bg-white/30 hover:bg-white/50 w-2'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
