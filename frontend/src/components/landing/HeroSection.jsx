import React, { useState, useEffect } from 'react';
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

  return (
    <section id="home" className="relative h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Background Images Slider */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover object-center"
            />
          </div>
        ))}
        
        {/* Dark gradient overlays for blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/70 to-[#0a0a0f]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/80 via-transparent to-[#0a0a0f]" />
        {/* Purple/Fuchsia duotone overlay */}
        <div className="absolute inset-0 bg-purple-900/20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/15 via-transparent to-purple-900/20" />
      </div>

      {/* Gradient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[150px]" />
        {/* Bottom mist effect */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-purple-800/30 via-fuchsia-600/10 to-transparent" />
      </div>

      {/* Main Content - Vertically Centered */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
          
          {/* Left Content */}
          <div className="space-y-5 text-left z-10">
            <p className="text-fuchsia-400 tracking-[0.2em] uppercase text-xs font-medium">
              Meet Your Newest <span className="text-fuchsia-300">Elite Escort</span>
            </p>
            
            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] xl:text-[5.5rem] font-black text-white leading-[0.95] tracking-tight">
              <span className="block">HAVE YOU</span>
              <span className="block">NEGOTIATE?</span>
            </h1>

            <p className="text-gray-300 text-base max-w-md leading-relaxed">
              Refined, flirtatious, and habit‑forming. One evening together won't be enough.
            </p>

            <Button 
              className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-semibold px-8 py-5 rounded-full text-sm shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:shadow-fuchsia-500/50"
            >
              Negotiate
            </Button>
          </div>

          {/* Right Content - Floating Card */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Floating Profile Card */}
            <div className="w-48 lg:w-56 bg-[#1a1a2e]/90 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl">
              <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-white text-xs font-medium text-center mb-2">
                Experience Premium
              </p>
              <p className="text-gray-400 text-xs text-center mb-3">
                on Your Terms
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-2 rounded-full text-xs transition-all duration-300"
              >
                Generate Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Indicator - Fixed at Bottom */}
      <div className="absolute bottom-8 left-8 flex items-center gap-3 z-20">
        <span className="text-white font-medium text-sm">
          {String(currentSlide + 1).padStart(2, '0')}
        </span>
        <div className="w-28 h-[2px] bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
        </div>
        <span className="text-gray-500 text-sm">
          {String(totalSlides).padStart(2, '0')}
        </span>
      </div>

      {/* Navigation Arrows - Fixed at Bottom Right */}
      <div className="absolute bottom-8 right-8 flex gap-2 z-20">
        <button 
          onClick={prevSlide}
          className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors bg-white/5"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={nextSlide}
          className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors bg-gradient-to-r from-blue-500/20 to-purple-500/20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-fuchsia-500 w-6' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
