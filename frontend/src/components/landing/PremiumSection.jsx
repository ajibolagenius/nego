import React from 'react';
import { Heart, Lock } from 'lucide-react';
import { Button } from '../ui/button';

const PremiumSection = () => {
  const lockedContent = [
    { id: 1, blur: true },
    { id: 2, blur: true },
    { id: 3, blur: true },
  ];

  return (
    <section id="premium" className="relative py-20 lg:py-32 bg-[#0a0a0f] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-purple-900/20 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-amber-400 tracking-[0.3em] uppercase text-xs font-medium">
                Get Premium Account
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                UNLOCK ALL<br />PRIVATE CONTENT
              </h2>
            </div>

            <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
              Get exclusive access to premium profiles, private galleries, and priority booking. 
              Premium members enjoy verified talent content, early access to new talent, 
              and dedicated support for the ultimate experience.
            </p>

            <Button 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold px-8 py-6 rounded-full text-lg shadow-lg shadow-amber-500/30 transition-all duration-300 hover:shadow-amber-500/50 hover:scale-105"
            >
              Get Now
            </Button>
          </div>

          {/* Right Content - Locked Cards */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Main Featured Image */}
              <div className="relative w-64 sm:w-72 lg:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80"
                  alt="Premium talent"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Locked Cards Around */}
              {/* Left Card */}
              <div className="absolute -left-8 lg:-left-16 top-1/4 w-32 lg:w-40 aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-500/30 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80"
                  alt="Locked content"
                  className="w-full h-full object-cover blur-md"
                />
                <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center">
                  <div className="relative">
                    <Heart className="w-8 h-8 text-white fill-white" />
                    <Lock className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Right Top Card */}
              <div className="absolute -right-4 lg:-right-12 top-8 w-28 lg:w-36 aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-500/30 transform rotate-6 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80"
                  alt="Locked content"
                  className="w-full h-full object-cover blur-md"
                />
                <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center">
                  <div className="relative">
                    <Heart className="w-8 h-8 text-white fill-white" />
                    <Lock className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Right Bottom Card */}
              <div className="absolute -right-6 lg:-right-14 bottom-1/4 w-32 lg:w-40 aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-500/30 transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80"
                  alt="Locked content"
                  className="w-full h-full object-cover blur-md"
                />
                <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center">
                  <div className="relative">
                    <Heart className="w-8 h-8 text-white fill-white" />
                    <Lock className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumSection;
