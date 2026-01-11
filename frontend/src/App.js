import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/landing/Header";
import HeroSection from "./components/landing/HeroSection";
import AboutSection from "./components/landing/AboutSection";
import TalentSection from "./components/landing/TalentSection";
import PremiumSection from "./components/landing/PremiumSection";
import Footer from "./components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <TalentSection />
        <PremiumSection />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
