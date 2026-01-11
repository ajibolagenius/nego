import React from 'react';

const AboutSection = () => {
  return (
    <section id="about" className="relative py-20 lg:py-28 bg-[#0a0a0f] overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-purple-900/20 to-[#0a0a0f]" />
        {/* Dotted Pattern - Bottom Right */}
        <div 
          className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(217, 70, 239, 0.5) 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <p className="text-fuchsia-400 tracking-[0.25em] uppercase text-xs font-medium">
              About Us
            </p>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              WHAT IS <span className="text-fuchsia-400">NEGO.AI</span>
            </h2>

            <p className="text-gray-400 text-base leading-relaxed max-w-lg">
              Nego is a premium managed marketplace connecting discerning clients with verified, elite talent. 
              Our platform operates with complete transparency and security, featuring admin-controlled 
              financial settlements and a post-payment verification gate that ensures safety for all parties.
            </p>

            <p className="text-gray-400 text-base leading-relaxed max-w-lg">
              Whether you need companionship for a corporate event, a sophisticated dinner date, or 
              a travel companion, Nego delivers excellence with discretion. Our talent sets their own 
              prices while our admin team ensures quality and professionalism.
            </p>
          </div>

          {/* Right Content - Stacked Images */}
          <div className="relative h-[450px] lg:h-[520px] flex items-center justify-center">
            {/* Back Image - Right */}
            <div className="absolute right-0 top-0 w-40 lg:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl z-10">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80"
                alt="Talent 1"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Middle Image - Center */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-48 lg:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl z-20">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80"
                alt="Talent 2"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Front Image - Left */}
            <div className="absolute left-0 bottom-0 w-40 lg:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl z-30">
              <img
                src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80"
                alt="Talent 3"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
