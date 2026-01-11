import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 10;

  return (
    <section id="home" className="relative min-h-screen bg-[#0a0a0f] overflow-hidden pt-20">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/00ey4ncl_naked-black-4664328_1920.jpg"
          alt="Background"
          className="w-full h-full object-cover object-center opacity-40"
        />
        {/* Dark gradient overlays for blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/90 via-transparent to-[#0a0a0f]" />
        {/* Purple/Fuchsia duotone overlay */}
        <div className="absolute inset-0 bg-purple-900/30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-transparent to-purple-900/30" />
      </div>

      {/* Gradient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-fuchsia-600/15 rounded-full blur-[150px]" />
        {/* Bottom mist effect */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-purple-800/40 via-fuchsia-600/10 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-4 items-end min-h-[calc(100vh-5rem)]">
          
          {/* Left Content */}
          <div className="space-y-5 text-left z-10 pb-32">
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
              Try for Free
            </Button>
          </div>

          {/* Right Content - Floating Card Only */}
          <div className="relative flex justify-center lg:justify-end pb-32">
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

        {/* Slider Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-8 flex items-center gap-3">
          <span className="text-white font-medium text-sm">0{currentSlide}</span>
          <div className="w-28 h-[2px] bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 text-sm">{totalSlides}</span>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute bottom-8 right-8 flex gap-2">
          <button 
            onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
            className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors bg-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
            className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors bg-gradient-to-r from-blue-500/20 to-purple-500/20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
