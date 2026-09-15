import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { NewAnalysisWorkspace } from './NewAnalysisWorkspace';
import { AnalysisHistoryView } from './AnalysisHistoryView';
import { ReportsView } from './ReportsView';
import { ModelsAndToolsView } from './ModelsAndToolsView';
import { SettingsView } from '../settings/SettingsView';
import { DedicatedChatView } from '../chat/DedicatedChatView';
import { WorkspaceView } from '../workspace/WorkspaceView';
import { 
  DashboardView, 
  UserProfile, 
  ReportItem 
} from '../../types';
import { AnalysisScenario, MOCK_SCENARIOS } from '../../data/mockData';
import { Footer } from '../layout/Footer';
import { ModernSatelliteAiLogo } from '../landing/LandingNavbar';
import { SatQueryApiService, BackendHealth } from '../../services/apiService';

interface DashboardLayoutProps {
  user: UserProfile;
  onBackToLanding: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
  initialView?: DashboardView;
  onSignOut?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onBackToLanding,
  onUpdateProfile,
  initialView = 'new-analysis',
  onSignOut
}) => {
  const [currentView, setCurrentView] = useState<DashboardView>(initialView);
  const [selectedScenario] = useState<AnalysisScenario>(MOCK_SCENARIOS[0]);
  const [savedReports, setSavedReports] = useState<ReportItem[]>([]);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const checkBackendHealth = async () => {
    setHealthStatus('checking');
    try {
      const health = await SatQueryApiService.checkHealth();
      if (health && (health.status === 'ok' || health.status === 'online' || health.status === 'healthy')) {
        setBackendHealth(health);
        setHealthStatus('online');
      } else {
        setBackendHealth(null);
        setHealthStatus('offline');
      }
    } catch {
      setBackendHealth(null);
      setHealthStatus('offline');
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const timer = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveReport = (report: ReportItem) => {
    setSavedReports(prev => [report, ...prev]);
  };

  const handleViewReportInHistory = (_report: ReportItem) => {
    setCurrentView('reports');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Workspace Top Header Bar - with Back to Home button */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Button to return to landing page */}
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold text-xs sm:text-sm shadow-xs hover:border-blue-300 transition-all cursor-pointer active:scale-95"
            title="Return to Landing Page"
            aria-label="Return to Landing Page"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Back to Home</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <ModernSatelliteAiLogo size="sm" showText={true} />
          </div>

          {/* Quick Switcher: New Analysis & Saved Reports */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 ml-1 sm:ml-2">
            <button
              type="button"
              onClick={() => setCurrentView('new-analysis')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'new-analysis'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Analysis
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('reports')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'reports'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saved Reports {savedReports.length > 0 && `(${savedReports.length})`}
            </button>
          </div>
        </div>

        {/* Right side: AI System Status badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={checkBackendHealth}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs border ${
              healthStatus === 'online'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : healthStatus === 'checking'
                ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title="Click to refresh AI Core status"
          >
            {healthStatus === 'online' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>AI System Ready</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-bold uppercase">
                  {backendHealth?.device ? backendHealth.device : 'Online'}
                </span>
              </>
            ) : healthStatus === 'checking' ? (
              <>
                <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                <span>Checking AI Core...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>AI Engine Offline</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900 font-bold uppercase">
                  Fallback
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace (Full Width - No Side Menu) */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-[calc(100vh-53px)]">
          <div className="flex-1">
            {/* View 1: New Analysis */}
            {currentView === 'new-analysis' && (
              <NewAnalysisWorkspace
                initialScenario={selectedScenario}
                onSaveReport={handleSaveReport}
                onViewReports={() => setCurrentView('reports')}
              />
            )}

            {/* View 2: Models & Tools */}
            {currentView === 'models' && (
              <ModelsAndToolsView
                onSelectModelTask={() => {
                  setCurrentView('new-analysis');
                }}
              />
            )}

            {/* View 3: Orbit AI Copilot Chat */}
            {currentView === 'chat' && (
              <DedicatedChatView
                onNavigateToWorkspace={() => setCurrentView('workspace')}
                onNavigate={(screen) => {
                  if (screen === 'dashboard') setCurrentView('new-analysis');
                }}
              />
            )}

            {/* View 4: Geospatial Canvas / Workspace */}
            {currentView === 'workspace' && (
              <WorkspaceView />
            )}

            {/* View 5: Analysis History */}
            {currentView === 'history' && (
              <AnalysisHistoryView
                customReports={savedReports}
                onViewReport={handleViewReportInHistory}
                onOpenInWorkspace={(_rep) => {
                  setCurrentView('new-analysis');
                }}
              />
            )}

            {/* View 6: Saved Reports */}
            {currentView === 'reports' && (
              <ReportsView 
                customReports={savedReports} 
                onNewAnalysis={() => setCurrentView('new-analysis')}
              />
            )}

            {/* View 7: Settings Page */}
            {currentView === 'settings' && (
              <SettingsView
                user={user}
                onUpdateProfile={onUpdateProfile}
                initialTab="profile"
                onSignOut={onSignOut}
              />
            )}
          </div>

          {/* Workspace Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
};
