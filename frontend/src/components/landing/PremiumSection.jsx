import React, { useState, useEffect, useRef } from 'react';
import { Heart, Lock, Sparkle, Crown, Star } from '@phosphor-icons/react';
import { Button } from '../ui/button';

const PremiumSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const benefits = [
    { icon: Crown, label: 'Priority Access' },
    { icon: Star, label: 'Exclusive Content' },
    { icon: Sparkle, label: 'VIP Support' },
  ];

  return (
    <section ref={sectionRef} id="premium" className="relative py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className={`absolute top-1/4 right-1/4 w-96 h-96 bg-[#df2531]/10 rounded-full blur-[150px] transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#df2531]/10 to-transparent transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Masonry Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Text Content - Left Block */}
          <div className={`lg:col-span-5 flex flex-col justify-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}>
            <p className="text-[#df2531]/80 tracking-[0.3em] uppercase text-xs font-medium mb-4">
              Get Premium Account
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6" style={{ fontFamily: "'Playfair', serif" }}>
              UNLOCK ALL<br />PRIVATE CONTENT
            </h2>
            <p className="text-white/50 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              Get exclusive access to premium profiles, private galleries, and priority booking. 
              Premium members enjoy verified talent content and dedicated support.
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap gap-3 mb-8">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-[#df2531]/30 hover:bg-[#df2531]/10 transition-all duration-500 cursor-pointer ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${0.4 + index * 0.1}s` }}
                >
                  <benefit.icon size={16} weight="duotone" className="text-[#df2531]" />
                  <span className="text-white text-sm">{benefit.label}</span>
                </div>
              ))}
            </div>

            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0.6s' }}>
              <Button className="group bg-[#df2531] hover:bg-[#c41f2a] text-white font-bold px-10 py-6 rounded-full shadow-lg shadow-[#df2531]/30 hover:shadow-[#df2531]/50 transition-all duration-300 hover:scale-105 active:scale-95">
                <span className="flex items-center gap-2">
                  Get Now
                  <Sparkle size={18} weight="fill" className="transition-transform duration-300 group-hover:rotate-12" />
                </span>
              </Button>
            </div>
          </div>

          {/* Image Cards - Masonry Right Block */}
          <div className={`lg:col-span-7 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`} style={{ transitionDelay: '0.3s' }}>
            <div className="grid grid-cols-3 gap-4 h-full">
              {/* Main large card */}
              <div 
                className="col-span-2 row-span-2 relative rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer"
                onMouseEnter={() => setHoveredCard(0)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80"
                  alt="Premium"
                  className="w-full h-full min-h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Premium badge */}
                <div className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#df2531] transition-all duration-500 ${hoveredCard === 0 ? 'scale-110' : 'scale-100'}`}>
                  <Crown size={14} weight="fill" className="text-white" />
                  <span className="text-white text-xs font-medium">Premium</span>
                </div>
              </div>

              {/* Small locked cards */}
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className={`relative rounded-xl md:rounded-2xl overflow-hidden border-2 border-[#df2531]/30 group cursor-pointer transition-all duration-500 hover:border-[#df2531] ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${0.4 + i * 0.1}s` }}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <img
                    src={`https://images.unsplash.com/photo-${i === 1 ? '1524504388940-b1c1722653e1' : i === 2 ? '1517841905240-472988babdf9' : '1531746020798-e6953c6e8e04'}?w=300&q=80`}
                    alt="Locked"
                    className="w-full h-full min-h-[120px] object-cover blur-md transition-all duration-500 group-hover:blur-sm"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-500 group-hover:bg-[#df2531]/30">
                    <div className={`relative transition-transform duration-500 ${hoveredCard === i ? 'scale-110' : 'scale-100'}`}>
                      <Heart size={28} weight="duotone" className="text-white" />
                      <Lock size={12} weight="fill" className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumSection;
