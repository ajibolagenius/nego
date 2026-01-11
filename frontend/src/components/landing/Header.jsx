import React, { useState, useEffect } from 'react';
import { List, X, Coin, CaretDown } from '@phosphor-icons/react';
import { Button } from '../ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Update active link based on scroll position
      const sections = ['home', 'about', 'talent', 'premium'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveLink(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home', id: 'home' },
    { name: 'About us', href: '#about', id: 'about' },
    { name: 'Collection', href: '#talent', id: 'talent' },
    { name: 'Private Content', href: '#premium', id: 'premium' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/5 py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo with hover animation */}
          <a 
            href="#home" 
            className="flex items-center group"
            onClick={() => setActiveLink('home')}
          >
            <span className="text-xl md:text-2xl font-bold transition-all duration-300 group-hover:scale-105" style={{ fontFamily: "'Playfair', serif" }}>
              <span className="text-white">NEGO</span>
              <span className="text-[#df2531] transition-all duration-300 group-hover:animate-pulse">.</span>
            </span>
          </a>

          {/* Desktop Navigation with animated underline */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setActiveLink(link.id)}
                className="relative px-4 py-2 group"
              >
                <span className={`transition-colors duration-300 text-sm font-medium ${
                  activeLink === link.id ? 'text-white' : 'text-white/50 group-hover:text-white'
                }`}>
                  {link.name}
                </span>
                {/* Animated underline */}
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#df2531] transition-all duration-300 ${
                  activeLink === link.id ? 'w-6' : 'w-0 group-hover:w-4'
                }`} />
              </a>
            ))}
          </nav>

          {/* CTA Button with pulse animation */}
          <div className="hidden md:flex items-center">
            <Button 
              className="relative bg-white/10 hover:bg-[#df2531] text-white font-medium px-4 lg:px-5 py-2 lg:py-2.5 rounded-full flex items-center gap-2 border border-white/10 hover:border-[#df2531] transition-all duration-500 text-sm group overflow-hidden"
            >
              <span className="absolute inset-0 bg-[#df2531] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <Coin size={18} weight="duotone" className="relative z-10 text-[#df2531] group-hover:text-white transition-colors duration-300" />
              <span className="relative z-10 hidden sm:inline">Buy Tokens</span>
              <CaretDown size={14} weight="bold" className="relative z-10 transition-transform duration-300 group-hover:rotate-180" />
            </Button>
          </div>

          {/* Mobile Menu Button with rotation animation */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white transition-transform duration-300 hover:scale-110"
          >
            <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
              {isMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
            </div>
          </button>
        </div>

        {/* Mobile Menu with slide animation */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/5 transition-all duration-500 ${
          isMenuOpen ? 'opacity-100 translate-y-0 max-h-96' : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden'
        }`}>
          <nav className="flex flex-col py-4">
            {navLinks.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => { setIsMenuOpen(false); setActiveLink(link.id); }}
                className={`text-white/70 hover:text-white hover:bg-white/5 px-6 py-3 transition-all duration-300 transform ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
