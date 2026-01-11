import React, { useState } from 'react';
import { Menu, X, Coins } from 'lucide-react';
import { Button } from '../ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#home', active: true },
    { name: 'About us', href: '#about' },
    { name: 'Collection', href: '#talent' },
    { name: 'Private Content', href: '#premium' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="text-white">NEGO</span>
              <span className="text-fuchsia-500">.</span>
            </span>
          </a>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`transition-colors duration-200 text-sm font-medium ${
                  link.active ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <Button 
              className="bg-[#1a1a2e] hover:bg-[#252540] text-white font-medium px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/10 transition-all duration-300"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                <Coins className="w-3 h-3 text-white" />
              </div>
              Buy Tokens
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
            <nav className="flex flex-col py-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-300 hover:text-white hover:bg-white/5 px-6 py-3 transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
              <div className="px-6 py-4">
                <Button 
                  className="w-full bg-[#1a1a2e] text-white font-medium px-5 py-2.5 rounded-full flex items-center justify-center gap-2 border border-white/10"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Coins className="w-3 h-3 text-white" />
                  </div>
                  Buy Tokens
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
