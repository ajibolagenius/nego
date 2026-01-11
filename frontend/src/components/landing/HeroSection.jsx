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
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-purple-900/40 to-transparent" />
        {/* Mist/Smoke effect at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-fuchsia-500/10 to-transparent blur-xl" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center min-h-[calc(100vh-8rem)]">
          {/* Left Content */}
          <div className="space-y-6 text-left z-10">
            <div className="space-y-2">
              <p className="text-fuchsia-400 tracking-[0.25em] uppercase text-xs font-medium">
                Meet Your Newest <span className="text-fuchsia-300">Premium Talent</span>
              </p>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-[9rem] font-black text-white leading-[0.85] tracking-tight">
                {featuredTalent.name.split(' ').map((word, i) => (
                  <span key={i} className="block">{word.toUpperCase()}</span>
                ))}
              </h1>
            </div>

            <p className="text-gray-400 text-base max-w-md leading-relaxed">
              {featuredTalent.description}
            </p>

            <Button 
              className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-semibold px-8 py-6 rounded-full text-base shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:shadow-fuchsia-500/50 hover:scale-105"
            >
              Try for Free
            </Button>
          </div>

          {/* Right Content - Featured Talent Image + Card */}
          <div className="relative flex justify-center lg:justify-end items-end">
            {/* Main Talent Image - positioned to overlap bottom */}
            <div className="relative">
              <div className="relative w-80 sm:w-96 lg:w-[420px] aspect-[3/4]">
                <img
                  src={featuredTalent.image}
                  alt={featuredTalent.name}
                  className="w-full h-full object-cover object-top"
                />
                {/* Gradient fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
              </div>

              {/* Floating Profile Card */}
              <div className="absolute -right-4 lg:right-8 top-1/4 w-48 lg:w-56 bg-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl">
                <div className="aspect-[4/5] rounded-xl overflow-hidden mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white text-sm font-medium text-center mb-3">
                  Experience Premium<br />
                  <span className="text-gray-400">on Your Terms</span>
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-medium py-2 rounded-full text-sm transition-all duration-300"
                >
                  Generate Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Slider Indicator - Bottom */}
        <div className="absolute bottom-8 left-8 lg:left-auto lg:right-8 flex items-center gap-4">
          <span className="text-white font-medium text-sm">0{currentSlide}</span>
          <div className="w-24 lg:w-32 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 text-sm">{totalSlides}</span>
          
          <div className="flex gap-2 ml-4">
            <button 
              onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
