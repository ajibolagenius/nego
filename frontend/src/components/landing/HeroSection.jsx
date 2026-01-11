import React, { useState, useEffect } from 'react';
import { CaretLeft, CaretRight, ArrowDown } from '@phosphor-icons/react';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const totalSlides = heroImages.length;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Parallax effect on mouse move
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePosition({ x, y });
  };

  return (
    <section 
      id="home" 
      className="relative h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Background Images with Ken Burns effect */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${
                index === currentSlide ? 'scale-110' : 'scale-100'
              }`}
              style={{
                transform: index === currentSlide 
                  ? `scale(1.1) translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` 
                  : 'scale(1)'
              }}
            />
          </div>
        ))}
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        <div className="absolute inset-0 bg-[#df2531]/5 mix-blend-overlay" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#df2531]/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`
            }}
          />
        ))}
      </div>

      {/* Main Content - Single Column Centered */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center z-10 max-w-4xl px-4">
          <p 
            className={`text-[#df2531] tracking-[0.2em] md:tracking-[0.3em] uppercase text-xs md:text-sm font-semibold mb-4 md:mb-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '0.2s' }}
          >
            Meet Your Newest <span className="text-[#df2531]/70">Elite Escort</span>
          </p>
          
          <h1 
            className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white leading-[0.9] tracking-tight mb-6 md:mb-8 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.4s', fontFamily: "'Playfair', serif" }}
          >
            <span className="block overflow-hidden">
              <span className={`inline-block transition-transform duration-1000 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`} style={{ transitionDelay: '0.5s' }}>
                HAVE YOU
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className={`inline-block transition-transform duration-1000 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`} style={{ transitionDelay: '0.7s' }}>
                NEGOTIATE?
              </span>
            </span>
          </h1>

          <p 
            className={`text-white/60 text-base md:text-lg lg:text-xl max-w-md md:max-w-xl mx-auto leading-relaxed mb-8 md:mb-10 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '0.8s' }}
          >
            Refined, flirtatious, and habit‑forming. One evening together won't be enough.
          </p>

          <div
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '1s' }}
          >
            <Button 
              className="group bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold px-8 md:px-10 py-5 md:py-6 rounded-full text-sm md:text-base shadow-lg shadow-[#df2531]/30 transition-all duration-300 hover:shadow-[#df2531]/50 hover:scale-105 active:scale-95"
            >
              <span className="flex items-center gap-2">
                Negotiate
                <ArrowDown size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-y-1" />
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Slide Counter */}
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">{String(currentSlide + 1).padStart(2, '0')}</span>
            <div className="w-20 md:w-32 h-[2px] bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#df2531] rounded-full transition-all duration-500"
                style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
              />
            </div>
            <span className="text-white/40 text-sm">{String(totalSlides).padStart(2, '0')}</span>
          </div>

          {/* Dot indicators */}
          <div className="hidden sm:flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-500 hover:bg-[#df2531]/70 ${
                  index === currentSlide ? 'bg-[#df2531] w-8' : 'bg-white/20 w-2'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <button 
              onClick={prevSlide}
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 hover:border-[#df2531]/50 transition-all duration-300 active:scale-95"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button 
              onClick={nextSlide}
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white bg-[#df2531]/20 hover:bg-[#df2531]/40 hover:border-[#df2531] transition-all duration-300 active:scale-95"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`} style={{ transitionDelay: '1.5s' }}>
        <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-[#df2531] rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
