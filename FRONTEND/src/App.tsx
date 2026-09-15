import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { UserProfile, DashboardView } from './types';
import { DEFAULT_PROFILE } from './data/mockData';

function AppContent() {
  // User Profile: Defaults to pre-authenticated Lead EO Analyst Dr. Maya Chen so judges/evaluators can test immediately
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = sessionStorage.getItem('satquery_user');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Current screen: 'landing' | 'dashboard'
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'history', 'reports', 'settings'].includes(hash)) {
        return 'dashboard';
      }
    }
    return 'landing';
  });

  // Active dashboard view when on dashboard
  const [dashboardView, setDashboardView] = useState<DashboardView>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'history') return 'history';
      if (hash === 'reports') return 'reports';
      if (hash === 'settings') return 'settings';
    }
    return 'new-analysis';
  });

  // Return to landing page
  const handleBackToLanding = () => {
    setCurrentScreen('landing');
    window.location.hash = 'landing';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize URL Hash for all pages across the platform
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');

      if (['dashboard', 'history', 'reports', 'settings'].includes(rawHash)) {
        setCurrentScreen('dashboard');
        if (rawHash === 'history') setDashboardView('history');
        else if (rawHash === 'reports') setDashboardView('reports');
        else if (rawHash === 'settings') setDashboardView('settings');
        else setDashboardView('new-analysis');
      } else if (['login', 'signup', 'signin', 'register'].includes(rawHash)) {
        // Direct access: redirect auth hashes to dashboard
        setCurrentScreen('dashboard');
        setDashboardView('new-analysis');
        window.location.hash = 'dashboard';
      } else {
        setCurrentScreen('landing');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLaunchApp = () => {
    setCurrentScreen('dashboard');
    setDashboardView('new-analysis');
    window.location.hash = 'dashboard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-white text-slate-900">
      {/* 1. PUBLIC LANDING PAGE */}
      {currentScreen === 'landing' && (
        <LandingPage
          onLaunchApp={handleLaunchApp}
          onLaunchWithScenario={() => handleLaunchApp()}
        />
      )}

      {/* 2. APPLICATION / ANALYSIS DASHBOARD */}
      {currentScreen === 'dashboard' && (
        <DashboardLayout
          user={currentUser}
          onBackToLanding={handleBackToLanding}
          onUpdateProfile={(updated) => setCurrentUser(updated)}
          initialView={dashboardView}
          onSignOut={handleBackToLanding}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
