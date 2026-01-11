import React, { useState, useEffect, useRef } from 'react';
import { Heart, Lock, Sparkle, Crown, Star, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '../ui/button';
import api from '../../services/api';

const fallbackImages = [
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
];

const PremiumSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [privateContent, setPrivateContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await api.getPrivateContent({ limit: 3 });
        setPrivateContent(data);
      } catch (error) {
        console.error('Failed to fetch private content:', error);
        // Fallback to mock images
        setPrivateContent(fallbackImages.map((img, i) => ({
          id: `fallback-${i}`,
          image_url: img,
          is_locked: true,
          unlock_price: 50 + i * 25
        })));
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const lockedImages = privateContent.length > 0 
    ? privateContent.map(c => c.image_url)
    : fallbackImages;

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          
          {/* Text Content */}
          <div className={`transition-all duration-700 ${
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

          {/* 3 Locked Image Cards */}
          <div className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`} style={{ transitionDelay: '0.3s' }}>
            <div className="grid grid-cols-3 gap-4">
              {lockedImages.map((image, index) => (
                <div 
                  key={index}
                  className={`relative aspect-[3/4] rounded-xl md:rounded-2xl overflow-hidden border-2 border-[#df2531]/30 group cursor-pointer transition-all duration-500 hover:border-[#df2531] ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ 
                    transitionDelay: `${0.4 + index * 0.15}s`,
                    transform: index === 1 ? 'translateY(-20px)' : 'translateY(0)'
                  }}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <img
                    src={image}
                    alt={`Locked content ${index + 1}`}
                    className="w-full h-full object-cover blur-md transition-all duration-500 group-hover:blur-sm group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-500 group-hover:bg-[#df2531]/20">
                    <div className={`relative transition-all duration-500 ${hoveredCard === index ? 'scale-110' : 'scale-100'}`}>
                      <Heart size={32} weight="duotone" className="text-white" />
                      <Lock size={14} weight="fill" className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  
                  {/* Hover label */}
                  <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent transition-all duration-500 ${
                    hoveredCard === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}>
                    <p className="text-white text-xs font-medium text-center">Unlock to View</p>
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
