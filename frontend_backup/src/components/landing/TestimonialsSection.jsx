import React from 'react';
import { Star, Quote } from 'lucide-react';
import { testimonials } from '../../data/mock';

const TestimonialsSection = () => {
  return (
    <section className="relative py-20 lg:py-32 bg-[#0a0a0f] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[200px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-fuchsia-400 tracking-[0.3em] uppercase text-xs font-medium mb-4">
            Testimonials
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white">
            WHAT MEMBERS SAY
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className="relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#1a1a2e]/40 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/5 hover:border-fuchsia-500/20 transition-all duration-500"
            >
              {/* Quote Icon */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-fuchsia-500 rounded-full flex items-center justify-center">
                <Quote className="w-5 h-5 text-white" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 text-sm lg:text-base leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="pt-4 border-t border-white/5">
                <p className="text-white font-semibold">{testimonial.name}</p>
                <p className="text-gray-500 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
