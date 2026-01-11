import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Heart, Eye, ArrowRight } from '@phosphor-icons/react';
import { Button } from '../ui/button';
import { popularTalents } from '../../data/mock';

const TalentCard = ({ talent, index, isVisible }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div 
      className={`group relative bg-white/5 rounded-xl md:rounded-2xl overflow-hidden border border-white/5 hover:border-[#df2531]/30 transition-all duration-500 cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        <img
          src={talent.image}
          alt={talent.location}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
        />
        
        {/* Overlay gradient */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-70'}`} />
        
        {/* Hover overlay with pattern */}
        <div className={`absolute inset-0 bg-[#df2531]/0 group-hover:bg-[#df2531]/10 transition-colors duration-500`} />
        
        {/* Top Actions */}
        <div className={`absolute top-3 right-3 flex gap-2 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
              liked ? 'bg-[#df2531] text-white' : 'bg-black/50 text-white hover:bg-[#df2531]'
            }`}
          >
            <Heart size={16} weight={liked ? "fill" : "duotone"} />
          </button>
          <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300">
            <Eye size={16} weight="duotone" />
          </button>
        </div>

        {/* Bottom Content */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-500`}>
          <div className={`flex items-center gap-1.5 transition-all duration-300 ${isHovered ? 'text-[#df2531]' : 'text-white/80'}`}>
            <MapPin size={14} weight="duotone" />
            <span className="text-sm font-medium">{talent.location}</span>
          </div>
          
          {/* Hover CTA */}
          <div className={`flex items-center gap-2 mt-2 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className="text-white text-xs">View Profile</span>
            <ArrowRight size={12} weight="bold" className="text-[#df2531]" />
          </div>
        </div>

        {/* Corner accent */}
        <div className={`absolute top-0 left-0 w-20 h-20 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#df2531]/20 to-transparent" />
        </div>
      </div>
    </div>
  );
};

const TalentSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="talent" className="relative py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#df2531]/5 rounded-full blur-[200px] transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with animation */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div>
            <p className="text-[#df2531] tracking-[0.2em] uppercase text-xs font-medium mb-2">Our Collection</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Playfair', serif" }}>
              POPULAR TALENT
            </h2>
          </div>
          <Button className="group bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium px-6 py-2.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95">
            <span className="flex items-center gap-2">
              See All
              <ArrowRight size={16} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Button>
        </div>

        {/* Masonry Grid Container */}
        <div className={`bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 border border-white/10 transition-all duration-700 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`} style={{ transitionDelay: '0.2s' }}>
          
          {/* Masonry-style Talent Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
            {popularTalents.map((talent, index) => (
              <TalentCard key={talent.id} talent={talent} index={index} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TalentSection;
