import React from 'react';
import { Utensils, Users, Sparkles, Plane } from 'lucide-react';
import { services } from '../../data/mock';

const iconMap = {
  utensils: Utensils,
  users: Users,
  sparkles: Sparkles,
  plane: Plane
};

const ServicesSection = () => {
  return (
    <section id="services" className="relative py-20 lg:py-32 bg-[#0a0a0f] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-fuchsia-400 tracking-[0.3em] uppercase text-xs font-medium mb-4">
            Our Services
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            PREMIUM EXPERIENCES
          </h2>
          <p className="text-gray-400 text-lg">
            Choose from our curated selection of companionship services, all delivered with 
            discretion and professionalism
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const IconComponent = iconMap[service.icon];
            return (
              <div 
                key={service.id}
                className="group relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#1a1a2e]/40 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-fuchsia-500/30 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                  <IconComponent className="w-7 h-7 text-fuchsia-400" />
                </div>

                {/* Content */}
                <h3 className="text-white font-bold text-xl mb-3">{service.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {service.description}
                </p>

                {/* Price */}
                <div className="pt-4 border-t border-white/5">
                  <p className="text-gray-500 text-xs">Starting from</p>
                  <p className="text-fuchsia-400 font-bold text-lg">
                    ₦{service.minPrice.toLocaleString()}
                  </p>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-500/0 to-purple-500/0 group-hover:from-fuchsia-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
