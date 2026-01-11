import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { popularTalents } from '../../data/mock';

const TalentCard = ({ talent }) => {
  return (
    <div className="group relative bg-[#1a1a2e]/50 rounded-2xl overflow-hidden border border-white/5 hover:border-fuchsia-500/30 transition-all duration-500">
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={talent.image}
          alt={talent.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-80" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-lg">{talent.name}</h3>
        <p className="text-fuchsia-400 text-sm">{talent.age} years old</p>
        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
          <MapPin className="w-3 h-3" />
          <span>{talent.location}</span>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-fuchsia-500/0 group-hover:bg-fuchsia-500/10 transition-colors duration-500" />
    </div>
  );
};

const TalentSection = () => {
  return (
    <section id="talent" className="relative py-20 lg:py-32 bg-[#0a0a0f] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-purple-900/10 via-transparent to-purple-900/10" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            POPULAR TALENT
          </h2>
          <Button 
            className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-medium px-6 py-2 rounded-full transition-all duration-300"
          >
            See All
          </Button>
        </div>

        {/* Glass Container */}
        <div className="bg-gradient-to-br from-purple-900/30 to-fuchsia-900/20 backdrop-blur-sm rounded-3xl p-6 lg:p-8 border border-white/5">
          {/* Talent Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {popularTalents.map((talent) => (
              <TalentCard key={talent.id} talent={talent} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TalentSection;
