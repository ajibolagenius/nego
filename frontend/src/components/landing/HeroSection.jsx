import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { featuredTalent } from '../../data/mock';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 10;

  return (
    <section id="home" className="relative min-h-screen bg-[#0a0a0f] overflow-hidden pt-20">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-purple-600/25 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[150px]" />
        {/* Bottom mist effect */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-purple-800/30 via-fuchsia-600/10 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-4 items-end min-h-[calc(100vh-5rem)]">
          
          {/* Left Content */}
          <div className="space-y-5 text-left z-10 pb-32">
            <p className="text-fuchsia-400 tracking-[0.2em] uppercase text-xs font-medium">
              Meet Your Newest <span className="text-fuchsia-300">Elite Talent</span>
            </p>
            
            <h1 className="text-6xl sm:text-7xl lg:text-[5.5rem] xl:text-[7rem] font-black text-white leading-[0.9] tracking-tight">
              {featuredTalent.name.split(' ').map((word, i) => (
                <span key={i} className="block">{word.toUpperCase()}</span>
              ))}
            </h1>

            <p className="text-gray-400 text-sm max-w-md leading-relaxed">
              {featuredTalent.description}
            </p>

            <Button 
              className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-semibold px-8 py-5 rounded-full text-sm shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:shadow-fuchsia-500/50"
            >
              Try for Free
            </Button>
          </div>

          {/* Right Content - Talent Image + Floating Card */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Main Talent Image */}
            <div className="relative w-72 sm:w-80 lg:w-[380px]">
              <img
                src={featuredTalent.image}
                alt={featuredTalent.name}
                className="w-full h-auto object-cover"
              />
              
              {/* Floating Profile Card */}
              <div className="absolute -right-2 lg:right-[-60px] top-16 w-44 lg:w-52 bg-[#1a1a2e]/90 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl">
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
