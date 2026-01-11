import { 
  Header, 
  HeroSection, 
  AboutSection, 
  TalentSection, 
  PremiumSection, 
  Footer 
} from '@/components/landing'

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <HeroSection />
      <AboutSection />
      <TalentSection />
      <PremiumSection />
      <Footer />
    </main>
  )
}
