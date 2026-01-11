import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Shield, Heart } from 'lucide-react';

const aboutImages = [
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/pkva1jgy_pexels-jaime-baskin-1089908384-20644317.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/4wpmqkgg_pexels-pedrofurtadoo-31094965.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/ux7m23fn_pexels-titibrazil-15488638.jpg",
  "https://customer-assets.emergentagent.com/job_secure-booking-3/artifacts/ta13tarq_pexels-titibrazil-33428529.jpg",
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
    { icon: Shield, label: 'Verified Talent', color: 'from-emerald-500 to-teal-500' },
    { icon: Heart, label: 'Premium Experience', color: 'from-rose-500 to-pink-500' },
    { icon: Sparkles, label: 'Exclusive Access', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <section 
      ref={sectionRef} 
      id="about" 
      className="relative py-16 md:py-24 lg:py-32 bg-[#0a0a0f] overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-purple-900/10 to-[#0a0a0f]" />
        {/* Animated Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 md:w-72 h-48 md:h-72 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 md:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-fuchsia-400 tracking-[0.2em] md:tracking-[0.3em] uppercase text-xs md:text-sm font-medium mb-3 md:mb-4">
            About Us
          </p>
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight"
            style={{ fontFamily: "'Playfair', serif" }}
          >
            WHAT IS <span className="text-fuchsia-400">NEGO</span>
          </h2>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* Large Text Card - Spans 2 columns */}
          <div 
            className={`lg:col-span-2 bg-gradient-to-br from-[#1a1a2e]/80 to-[#1a1a2e]/40 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/5 bento-item transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.1s' }}
          >
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6">
              Nego is a premium managed marketplace connecting discerning clients with verified, elite talent. 
              Our platform operates with complete transparency and security, featuring admin-controlled 
              financial settlements and a post-payment verification gate.
            </p>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
              Whether you need companionship for a corporate event, a sophisticated dinner date, or 
              a travel companion, Nego delivers excellence with discretion.
            </p>
            
            {/* Features Pills */}
            <div className="flex flex-wrap gap-3">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${feature.color} bg-opacity-10 border border-white/10 transition-all duration-300 hover:scale-105 cursor-pointer`}
                >
                  <feature.icon className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Card 1 - Tall */}
          <div 
            className={`row-span-2 relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.2s' }}
            onMouseEnter={() => setHoveredIndex(0)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img
              src={aboutImages[0]}
              alt="Elite Talent"
              className="w-full h-full min-h-[300px] md:min-h-[400px] object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${hoveredIndex === 0 ? 'opacity-100' : 'opacity-70'}`} />
            <div className={`absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6 transition-all duration-300 ${hoveredIndex === 0 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-80'}`}>
              <p className="text-fuchsia-400 text-xs font-medium mb-1">Featured</p>
              <h3 className="text-white text-lg md:text-xl font-bold" style={{ fontFamily: "'Playfair', serif" }}>
                Premium Selection
              </h3>
            </div>
          </div>

          {/* Image Card 2 */}
          <div 
            className={`relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom aspect-square transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.3s' }}
            onMouseEnter={() => setHoveredIndex(1)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img
              src={aboutImages[1]}
              alt="Exclusive"
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${hoveredIndex === 1 ? 'opacity-100' : 'opacity-70'}`} />
            <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${hoveredIndex === 1 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-80'}`}>
              <p className="text-white text-sm md:text-base font-bold" style={{ fontFamily: "'Playfair', serif" }}>
                Exclusive
              </p>
            </div>
          </div>

          {/* Stats Card */}
          <div 
            className={`bg-gradient-to-br from-fuchsia-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-6 border border-fuchsia-500/20 bento-item flex flex-col justify-center transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.4s' }}
          >
            <p className="text-4xl md:text-5xl font-black text-white mb-2" style={{ fontFamily: "'Playfair', serif" }}>
              500+
            </p>
            <p className="text-gray-400 text-sm">Elite Talent</p>
            <div className="mt-4 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full" />
          </div>

          {/* Image Card 3 */}
          <div 
            className={`relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom aspect-[4/3] md:aspect-auto transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.5s' }}
            onMouseEnter={() => setHoveredIndex(2)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img
              src={aboutImages[2]}
              alt="Curated"
              className="w-full h-full min-h-[200px] object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${hoveredIndex === 2 ? 'opacity-100' : 'opacity-70'}`} />
            <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${hoveredIndex === 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-80'}`}>
              <p className="text-white text-sm md:text-base font-bold" style={{ fontFamily: "'Playfair', serif" }}>
                Curated
              </p>
            </div>
          </div>

          {/* CTA Card */}
          <div 
            className={`bg-gradient-to-br from-[#1a1a2e]/80 to-[#1a1a2e]/40 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-6 border border-white/5 bento-item flex flex-col justify-between transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.6s' }}
          >
            <div>
              <p className="text-fuchsia-400 text-xs font-medium mb-2">Discover More</p>
              <h3 className="text-white text-lg md:text-xl font-bold mb-2" style={{ fontFamily: "'Playfair', serif" }}>
                Explore Our Collection
              </h3>
            </div>
            <button className="mt-4 flex items-center gap-2 text-white group">
              <span className="text-sm font-medium">View All</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Image Card 4 - Wide */}
          <div 
            className={`lg:col-span-2 relative rounded-2xl md:rounded-3xl overflow-hidden bento-item img-zoom aspect-[16/9] md:aspect-[21/9] transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.7s' }}
            onMouseEnter={() => setHoveredIndex(3)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img
              src={aboutImages[3]}
              alt="Premium Experience"
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent transition-opacity duration-300 ${hoveredIndex === 3 ? 'opacity-100' : 'opacity-70'}`} />
            <div className={`absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6 transition-all duration-300 ${hoveredIndex === 3 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-80'}`}>
              <p className="text-fuchsia-400 text-xs font-medium mb-1">Premium</p>
              <h3 className="text-white text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair', serif" }}>
                Unforgettable Experiences
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
