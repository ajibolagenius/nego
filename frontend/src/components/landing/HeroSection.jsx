import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Shield, Star, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { featuredTalent } from '../../data/mock';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 10;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <section id="home" className="relative min-h-screen bg-[#0a0a0f] overflow-hidden pt-20">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/30 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-10rem)]">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <p className="text-fuchsia-400 tracking-[0.3em] uppercase text-xs md:text-sm font-medium">
                Premium Managed Marketplace
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.9] tracking-tight">
                {featuredTalent.name.split(' ').map((word, i) => (
                  <span key={i} className="block">{word.toUpperCase()}</span>
                ))}
              </h1>
            </div>

            <p className="text-gray-400 text-base lg:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {featuredTalent.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-semibold px-8 py-6 rounded-full text-lg shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:shadow-fuchsia-500/50 hover:scale-105"
              >
                Browse Talent
              </Button>
              <Button 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-full text-lg backdrop-blur-sm transition-all duration-300"
              >
                How It Works
              </Button>
            </div>
          </div>

          {/* Right Content - Featured Talent Card */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Main Image */}
            <div className="relative">
              <div className="relative w-72 sm:w-80 lg:w-96 aspect-[3/4] rounded-3xl overflow-hidden">
                <img
                  src={featuredTalent.image}
                  alt={featuredTalent.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Floating Info Card */}
              <div className="absolute -right-4 lg:-right-8 top-1/2 -translate-y-1/2 w-56 lg:w-64 bg-[#1a1a2e]/90 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-white/10 shadow-2xl">
                <div className="aspect-[4/5] rounded-xl overflow-hidden mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium">Verified Talent</span>
                  </div>
                  <p className="text-white text-sm font-medium text-center">Experience Premium<br />Companionship</p>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-medium py-2 rounded-full text-sm transition-all duration-300"
                  >
                    View Profile
                  </Button>
                </div>
              </div>

              {/* Stats Badge */}
              <div className="absolute -left-4 lg:-left-8 bottom-20 bg-[#1a1a2e]/90 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-white font-bold">{featuredTalent.rating}</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">500+ Reviews</p>
              </div>

              {/* Location Badge */}
              <div className="absolute left-4 lg:left-0 bottom-4 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-fuchsia-400" />
                <span className="text-white text-sm">{featuredTalent.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slider Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <span className="text-white font-medium text-sm">0{currentSlide}</span>
          <div className="w-32 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 text-sm">{totalSlides}</span>
          
          <div className="flex gap-2 ml-4">
            <button 
              onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
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
