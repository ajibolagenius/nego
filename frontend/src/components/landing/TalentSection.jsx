import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { Button } from '../ui/button';
import { popularTalents } from '../../data/mock';

const TalentCard = ({ talent, index, isVisible }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`group relative bg-white/5 rounded-xl md:rounded-2xl overflow-hidden border border-white/5 hover:border-[#df2531]/30 transition-all duration-500 bento-item img-zoom cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={talent.image}
          alt={talent.location}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-90' : 'opacity-70'}`} />
      </div>

      {/* Location Only */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-4 transition-all duration-500 ${isHovered ? 'translate-y-0' : 'translate-y-1'}`}>
        <div className={`flex items-center gap-1.5 transition-all duration-500 ${isHovered ? 'text-[#df2531]' : 'text-white/70'}`}>
          <MapPin size={14} weight="duotone" />
          <span className="text-sm font-medium">{talent.location}</span>
        </div>
      </div>

      {/* Hover Overlay Effect */}
      <div className={`absolute inset-0 bg-[#df2531]/0 group-hover:bg-[#df2531]/10 transition-colors duration-500`} />
      
      {/* Corner accent on hover */}
      <div className={`absolute top-0 right-0 w-16 h-16 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#df2531]/30 to-transparent" />
      </div>
    </div>
  );
};

const TalentSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="talent" className="relative py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-[#df2531]/5 via-transparent to-[#df2531]/5" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white"
            style={{ fontFamily: "'Playfair', serif" }}
          >
            POPULAR TALENT
          </h2>
          <Button 
            className="bg-[#df2531] hover:bg-[#c41f2a] text-white font-medium px-5 md:px-6 py-2 rounded-full transition-all duration-300 text-sm hover:scale-105 active:scale-95"
          >
            See All
          </Button>
        </div>

        {/* Glass Container */}
        <div className={`bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 border border-white/10 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '0.2s' }}>
          {/* Talent Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
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
