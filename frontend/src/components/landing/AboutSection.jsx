import React from 'react';
import { Shield, Clock, CreditCard, Users } from 'lucide-react';
import { stats } from '../../data/mock';

const AboutSection = () => {
  const features = [
    {
      icon: Shield,
      title: 'Verified & Secure',
      description: 'Every booking goes through our rigorous verification process'
    },
    {
      icon: Clock,
      title: 'Real-time Availability',
      description: 'See who\'s available now and book instantly'
    },
    {
      icon: CreditCard,
      title: 'Escrow Protection',
      description: 'Your payment is held securely until service completion'
    },
    {
      icon: Users,
      title: 'Admin Managed',
      description: 'Professional oversight ensures quality and safety'
    }
  ];

  return (
    <section id="about" className="relative py-20 lg:py-32 bg-[#0a0a0f] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[150px]" />
        {/* Dotted Pattern */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-fuchsia-400 tracking-[0.3em] uppercase text-xs font-medium">
                About Us
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                WHAT IS <span className="text-fuchsia-400">NEGO</span>
              </h2>
            </div>

            <p className="text-gray-400 text-lg leading-relaxed">
              Nego is a premium managed marketplace connecting discerning clients with verified, elite talent. 
              Our platform operates with complete transparency and security, featuring admin-controlled 
              financial settlements and a post-payment verification gate that ensures safety for all parties.
            </p>

            <p className="text-gray-400 text-lg leading-relaxed">
              Whether you need companionship for a corporate event, a sophisticated dinner date, or 
              a travel companion, Nego delivers excellence with discretion. Our talent sets their own 
              prices while our admin team ensures quality and professionalism.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Images */}
          <div className="relative h-[500px] lg:h-[600px]">
            {/* Image Stack */}
            <div className="absolute right-0 top-0 w-48 lg:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80"
                alt="Talent 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute left-1/4 top-1/4 w-52 lg:w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500 z-10">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80"
                alt="Talent 2"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute left-0 bottom-0 w-44 lg:w-52 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80"
                alt="Talent 3"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-20 lg:mt-32 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl lg:text-4xl font-black text-white">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
