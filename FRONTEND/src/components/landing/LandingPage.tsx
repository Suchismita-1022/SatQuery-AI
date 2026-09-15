import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { CoreFeaturesSection } from './CoreFeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { UseCasesSection } from './UseCasesSection';
import { Footer } from '../layout/Footer';
import { RevealOnScroll } from '../common/RevealOnScroll';

interface LandingPageProps {
  onLaunchApp: () => void;
  onLaunchWithScenario?: (query?: string, mode?: 'single' | 'bi-temporal' | 'optical-sar') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onLaunchWithScenario
}) => {
  const handleScrollToFeatures = () => {
    const el = document.querySelector('#features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white overflow-x-hidden">

      {/* 1. Landing Navbar */}
      <LandingNavbar
        onLaunchApp={onLaunchApp}
      />

      {/* Main Sections */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* 1. Home (Hero Section) */}
        <LandingHero
          onLaunchApp={onLaunchApp}
          onExploreFeatures={handleScrollToFeatures}
        />

        {/* 2. Features */}
        <RevealOnScroll direction="up" delay={100} duration={1000}>
          <CoreFeaturesSection
            onLaunchWithQuery={(query, mode) => {
              if (onLaunchWithScenario) {
                onLaunchWithScenario(query, mode);
              } else {
                onLaunchApp();
              }
            }}
          />
        </RevealOnScroll>

        {/* 3. How It Works */}
        <RevealOnScroll direction="up" delay={80} duration={1000}>
          <HowItWorksSection />
        </RevealOnScroll>

        {/* 4. Use Cases */}
        <RevealOnScroll direction="up" delay={80} duration={1000}>
          <UseCasesSection />
        </RevealOnScroll>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
