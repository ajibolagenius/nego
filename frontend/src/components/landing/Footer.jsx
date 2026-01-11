import React from 'react';
import { Instagram, Twitter, Send, Shield, CreditCard, Clock } from 'lucide-react';
import { Button } from '../ui/button';

const Footer = () => {
  const footerLinks = {
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'How It Works', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#' },
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Safety Tips', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Privacy Policy', href: '#' },
    ],
    forTalent: [
      { name: 'Become a Talent', href: '#' },
      { name: 'Talent Guidelines', href: '#' },
      { name: 'Earnings & Payouts', href: '#' },
      { name: 'Success Stories', href: '#' },
    ],
  };

  const trustBadges = [
    { icon: Shield, text: 'Verified Profiles' },
    { icon: CreditCard, text: 'Secure Payments' },
    { icon: Clock, text: '24/7 Support' },
  ];

  return (
    <footer className="relative bg-[#0a0a0f] border-t border-white/5">
      {/* CTA Section */}
      <div className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-fuchsia-600/20 rounded-full blur-[150px]" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
            Ready to Experience <span className="text-fuchsia-400">Premium</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of members enjoying premium companionship. 
            Sign up today and get 100 bonus coins.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white font-semibold px-8 py-6 rounded-full text-lg shadow-lg shadow-fuchsia-500/30 transition-all duration-300 hover:shadow-fuchsia-500/50"
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-full text-lg transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                  <badge.icon className="w-5 h-5 text-fuchsia-400" />
                </div>
                <span className="text-white font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="inline-block mb-6">
              <span className="text-3xl font-bold">
                <span className="text-white">NEGO</span>
                <span className="text-amber-400">.</span>
              </span>
            </a>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The premier managed marketplace connecting discerning clients with verified, elite talent.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-fuchsia-500/20 flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-fuchsia-500/20 flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-fuchsia-500/20 flex items-center justify-center transition-colors">
                <Send className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">For Talent</h3>
            <ul className="space-y-3">
              {footerLinks.forTalent.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Nego. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Made with care in Nigeria 🇳🇬
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
