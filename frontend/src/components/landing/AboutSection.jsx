import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, Heart, Sparkle } from '@phosphor-icons/react';

const aboutImages = [
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/pkva1jgy_pexels-jaime-baskin-1089908384-20644317.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/4wpmqkgg_pexels-pedrofurtadoo-31094965.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/ux7m23fn_pexels-titibrazil-15488638.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/ta13tarq_pexels-titibrazil-33428529.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/mlmg4rfd_pexels-darcy-delia-345397-950758.jpg",
];

const AboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: ShieldCheck, label: 'Verified Talent' },
    { icon: Heart, label: 'Premium Experience' },
    { icon: Sparkle, label: 'Exclusive Access' },
  ];

  return (
    <section 
      ref={sectionRef} 
      id="about" 
      className="relative py-16 md:py-24 lg:py-32 bg-black overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#df2531]/5 to-black" />
        <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-[#df2531]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 md:w-72 h-48 md:h-72 bg-[#df2531]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 md:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[#df2531] tracking-[0.2em] md:tracking-[0.3em] uppercase text-xs md:text-sm font-medium mb-3 md:mb-4">
            About Us
          </p>
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight"
            style={{ fontFamily: "'Playfair', serif" }}
          >
            WHAT IS <span className="text-[#df2531]">NEGO</span>
          </h2>
        </div>

        {/* Bento Grid Layout - Perfectly Aligned */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          
          {/* Large Text Card - Spans 2 cols on mobile, 4 cols on desktop */}
          <div 
            className={`col-span-2 md:col-span-4 lg:col-span-3 row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 bento-item transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.1s' }}
          >
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-6">
              Nego is a premium managed marketplace connecting discerning clients with verified, elite talent. 
              Our platform operates with complete transparency and security, featuring admin-controlled 
              financial settlements and a post-payment verification gate.
            </p>
            <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6">
              Whether you need companionship for a corporate event, a sophisticated dinner date, or 
              a travel companion, Nego delivers excellence with discretion.
            </p>
            
            {/* Features Pills */}
            <div className="flex flex-wrap gap-3">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#df2531]/20 border border-[#df2531]/30 transition-all duration-300 hover:scale-105 hover:bg-[#df2531]/30 cursor-pointer"
                >
                  <feature.icon className="w-4 h-4 text-[#df2531]" weight="duotone" />
                  <span className="text-white text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image 1 - Square */}
          <div 
            className={`col-span-1 md:col-span-2 lg:col-span-1 aspect-square relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.2s' }}
            onMouseEnter={() => setHoveredIndex(0)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img src={aboutImages[0]} alt="Elite Talent" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${hoveredIndex === 0 ? 'opacity-100' : 'opacity-60'}`} />
            <div className={`absolute bottom-3 md:bottom-4 left-3 md:left-4 transition-all duration-300 ${hoveredIndex === 0 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
              <p className="text-white text-sm font-bold" style={{ fontFamily: "'Playfair', serif" }}>Featured</p>
            </div>
          </div>

          {/* Image 2 - Square */}
          <div 
            className={`col-span-1 md:col-span-2 lg:col-span-2 aspect-square lg:aspect-auto lg:row-span-2 relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.25s' }}
            onMouseEnter={() => setHoveredIndex(1)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img src={aboutImages[1]} alt="Exclusive" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${hoveredIndex === 1 ? 'opacity-100' : 'opacity-60'}`} />
            <div className={`absolute bottom-3 md:bottom-4 left-3 md:left-4 transition-all duration-300 ${hoveredIndex === 1 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
              <p className="text-white text-sm font-bold" style={{ fontFamily: "'Playfair', serif" }}>Exclusive</p>
            </div>
          </div>

          {/* Image 3 - Square */}
          <div 
            className={`col-span-1 md:col-span-2 lg:col-span-1 aspect-square relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.3s' }}
            onMouseEnter={() => setHoveredIndex(2)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img src={aboutImages[2]} alt="Curated" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${hoveredIndex === 2 ? 'opacity-100' : 'opacity-60'}`} />
            <div className={`absolute bottom-3 md:bottom-4 left-3 md:left-4 transition-all duration-300 ${hoveredIndex === 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
              <p className="text-white text-sm font-bold" style={{ fontFamily: "'Playfair', serif" }}>Curated</p>
            </div>
          </div>

          {/* CTA Card */}
          <div 
            className={`col-span-1 md:col-span-2 lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-6 border border-white/10 bento-item flex flex-col justify-between transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.35s' }}
          >
            <div>
              <p className="text-[#df2531] text-xs font-medium mb-2">Discover More</p>
              <h3 className="text-white text-lg md:text-xl font-bold" style={{ fontFamily: "'Playfair', serif" }}>
                Explore Our Collection
              </h3>
            </div>
            <button className="mt-4 flex items-center gap-2 text-white group">
              <span className="text-sm font-medium">View All</span>
              <ArrowRight size={16} weight="duotone" className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Image 4 - Wide */}
          <div 
            className={`col-span-2 md:col-span-4 lg:col-span-3 aspect-[16/9] md:aspect-[21/9] relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.4s' }}
            onMouseEnter={() => setHoveredIndex(3)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img src={aboutImages[3]} alt="Premium Experience" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent transition-opacity duration-300 ${hoveredIndex === 3 ? 'opacity-100' : 'opacity-60'}`} />
            <div className={`absolute bottom-4 md:bottom-6 left-4 md:left-6 transition-all duration-300 ${hoveredIndex === 3 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
              <p className="text-[#df2531] text-xs font-medium mb-1">Premium</p>
              <h3 className="text-white text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair', serif" }}>
                Unforgettable Experiences
              </h3>
            </div>
          </div>

          {/* Image 5 - New Image */}
          <div 
            className={`col-span-2 md:col-span-4 lg:col-span-3 aspect-[16/9] md:aspect-[21/9] relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.45s' }}
            onMouseEnter={() => setHoveredIndex(4)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img src={aboutImages[4]} alt="Sophisticated" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent transition-opacity duration-300 ${hoveredIndex === 4 ? 'opacity-100' : 'opacity-60'}`} />
            <div className={`absolute bottom-4 md:bottom-6 left-4 md:left-6 transition-all duration-300 ${hoveredIndex === 4 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
              <p className="text-[#df2531] text-xs font-medium mb-1">Sophisticated</p>
              <h3 className="text-white text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair', serif" }}>
                Elegance Redefined
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
