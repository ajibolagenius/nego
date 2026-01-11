import React, { useState } from 'react';
import { Globe, Instagram, Send } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');

  const navColumns = [
    {
      links: [
        { name: 'Home', href: '#home' },
        { name: 'About us', href: '#about' },
      ]
    },
    {
      links: [
        { name: 'Collection', href: '#talent' },
        { name: 'All Talent', href: '#talent' },
      ]
    },
    {
      links: [
        { name: 'Private Content', href: '#premium' },
        { name: 'Contact Us', href: '#' },
      ]
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <footer className="relative bg-[#0d0a1a] overflow-hidden">
      {/* Subtle texture/grain overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-20">
          {/* Left Side - Logo and Navigation */}
          <div className="flex flex-col sm:flex-row gap-10 lg:gap-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="#home" className="inline-block">
                <span className="text-3xl font-bold">
                  <span className="text-white">NEGO</span>
                  <span className="text-fuchsia-500">.</span>
                </span>
              </a>
            </div>

            {/* Navigation Columns */}
            <nav className="flex gap-12 lg:gap-16">
              {navColumns.map((column, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-4">
                  {column.links.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              ))}
            </nav>
          </div>

          {/* Right Side - Newsletter */}
          <div className="flex flex-col gap-4">
            <p className="text-fuchsia-400 font-medium italic">
              Subscribe to our newsletter:
            </p>
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center bg-[#1a1525]/80 backdrop-blur-sm border border-gray-700/50 rounded-full overflow-hidden pl-5 pr-1 py-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="bg-transparent text-gray-300 placeholder-gray-500 outline-none text-sm w-48 lg:w-56"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 flex items-center justify-center transition-all duration-300 flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />
      </div>

      {/* Bottom Bar */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <p className="text-fuchsia-400 text-sm">
            ©{new Date().getFullYear()} Nego | All Rights Reserved
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms & Conditions
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Our Socials:</span>
            <div className="flex items-center gap-2">
              <a 
                href="#" 
                className="w-9 h-9 rounded-full border border-fuchsia-500/50 flex items-center justify-center hover:bg-fuchsia-500/20 transition-colors"
              >
                <Globe className="w-4 h-4 text-fuchsia-400" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full border border-fuchsia-500/50 flex items-center justify-center hover:bg-fuchsia-500/20 transition-colors"
              >
                <svg className="w-4 h-4 text-fuchsia-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full border border-fuchsia-500/50 flex items-center justify-center hover:bg-fuchsia-500/20 transition-colors"
              >
                <svg className="w-4 h-4 text-fuchsia-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full border border-fuchsia-500/50 flex items-center justify-center hover:bg-fuchsia-500/20 transition-colors"
              >
                <Instagram className="w-4 h-4 text-fuchsia-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
