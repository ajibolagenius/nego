import React, { useState, useEffect } from 'react';
import { List, X, Coins } from '@phosphor-icons/react';
import { Button } from '../ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home', active: true },
    { name: 'About us', href: '#about' },
    { name: 'Collection', href: '#talent' },
    { name: 'Private Content', href: '#premium' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center">
            <span className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair', serif" }}>
              <span className="text-white">NEGO</span>
              <span className="text-[#df2531]">.</span>
            </span>
          </a>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`transition-colors duration-200 text-sm font-medium ${
                  link.active ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <Button 
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 lg:px-5 py-2 lg:py-2.5 rounded-full flex items-center gap-2 border border-white/10 transition-all duration-300 text-sm"
            >
              <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-[#df2531] flex items-center justify-center">
                <Coins className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" weight="duotone" />
              </div>
              <span className="hidden sm:inline">Buy Tokens</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            {isMenuOpen ? <X size={24} weight="duotone" /> : <List size={24} weight="duotone" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}>
          <nav className="flex flex-col py-4">
            {navLinks.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/5 px-6 py-3 transition-all duration-200"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {link.name}
              </a>
            ))}
            <div className="px-6 py-4">
              <Button 
                className="w-full bg-white/10 text-white font-medium px-5 py-2.5 rounded-full flex items-center justify-center gap-2 border border-white/10"
              >
                <div className="w-5 h-5 rounded-full bg-[#df2531] flex items-center justify-center">
                  <Coins className="w-3 h-3 text-white" weight="duotone" />
                </div>
                Buy Tokens
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
