import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import EmergencyBanner from './components/layout/EmergencyBanner';
import HotlineModal from './components/common/HotlineModal';
import OverviewView from './features/dashboard/OverviewView';
import MapView from './features/map/MapView';
import ReportView from './features/incidents/ReportView';
import RiskView from './features/risk-intelligence/RiskView';
import AssistanceView from './features/assistance/AssistanceView';
import AuthorityView from './features/authority/AuthorityView';
import AtmosphericBackground from './components/layout/AtmosphericBackground';
import { useIncidents } from './hooks/useIncidents';
import { useAssistancePoints } from './hooks/useAssistancePoints';
import './App.css';

/**
 * FloodWatch Kerala - Application Root Shell
 * Coordinates responsive layout, client-side navigation, shared incident state via services,
 * and emergency hotline access.
 */
function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hotlinesModalOpen, setHotlinesModalOpen] = useState(false);

  // Decoupled state management via service-backed hooks
  const {
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    addIncident,
    updateIncidentStatus,
    resetDemoIncidents,
  } = useIncidents();

  const {
    assistancePoints,
    selectedAssistancePointId,
    setSelectedAssistancePointId,
  } = useAssistancePoints();

  // Shared Risk Intelligence simulation parameters
  const [simulatedRainfall, setSimulatedRainfall] = useState(38.0); // mm/h
  const [decayHalfLife, setDecayHalfLife] = useState(2.0); // hours
  const [rainfallMultiplier, setRainfallMultiplier] = useState(1.2);

  // Close mobile navigation drawer on Escape key
  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  // Navigate between views and optionally focus on a specific incident or assistance point
  const handleNavigate = (tab, targetId = null, targetType = 'incident') => {
    setActiveTab(tab);
    if (targetId) {
      if (targetType === 'assistance' || (typeof targetId === 'string' && targetId.startsWith('AST-'))) {
        setSelectedAssistancePointId(targetId);
        setSelectedIncidentId(null);
      } else {
        setSelectedIncidentId(targetId);
        setSelectedAssistancePointId(null);
      }
    }
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fw-app-wrapper">
      {/* Cinematic Atmospheric Background (Margins Studio / GoShuin / Mapa do Astro inspired) */}
      <AtmosphericBackground />

      {/* Top Hackathon Demo Disclaimer Banner */}
      <EmergencyBanner onOpenHotlines={() => setHotlinesModalOpen(true)} />

      <div className="fw-app-layout">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          isOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          incidentCount={incidents.length}
          shelterCount={assistancePoints.length}
          onOpenHotlines={() => setHotlinesModalOpen(true)}
        />

        {/* Main Content Viewport */}
        <div className="fw-main-viewport">
          <Header
            activeTab={activeTab}
            isMobileNavOpen={mobileNavOpen}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onNavigateToReport={() => handleNavigate('report')}
            onOpenHotlines={() => setHotlinesModalOpen(true)}
          />

          <main id="main-content" className="fw-main-content" tabIndex={-1}>
            {activeTab === 'overview' && (
              <OverviewView
                incidents={incidents}
                simulatedRainfall={simulatedRainfall}
                rainfallMultiplier={rainfallMultiplier}
                onNavigate={(tab, id) => handleNavigate(tab, id)}
              />
            )}
            {activeTab === 'map' && (
              <MapView
                incidents={incidents}
                assistancePoints={assistancePoints}
                selectedIncidentId={selectedIncidentId}
                selectedAssistancePointId={selectedAssistancePointId}
                onSelectIncident={(id) => {
                  setSelectedIncidentId(id);
                  setSelectedAssistancePointId(null);
                }}
                onSelectAssistancePoint={(id) => {
                  setSelectedAssistancePointId(id);
                  setSelectedIncidentId(null);
                }}
                onNavigateToReport={() => handleNavigate('report')}
              />
            )}
            {activeTab === 'report' && (
              <ReportView
                onIncidentSubmitted={addIncident}
                onNavigate={(tab, id) => handleNavigate(tab, id)}
              />
            )}
            {activeTab === 'risk' && (
              <RiskView
                incidents={incidents}
                simulatedRainfall={simulatedRainfall}
                onSimulatedRainfallChange={setSimulatedRainfall}
                decayHalfLife={decayHalfLife}
                onDecayHalfLifeChange={setDecayHalfLife}
                rainfallMultiplier={rainfallMultiplier}
                onRainfallMultiplierChange={setRainfallMultiplier}
                onNavigate={(tab, id) => handleNavigate(tab, id)}
              />
            )}
            {activeTab === 'assistance' && (
              <AssistanceView
                assistancePoints={assistancePoints}
                onOpenHotlines={() => setHotlinesModalOpen(true)}
                onNavigateToMap={(pointId) => handleNavigate('map', pointId, 'assistance')}
              />
            )}
            {activeTab === 'authority' && (
              <AuthorityView
                incidents={incidents}
                onUpdateIncidentStatus={updateIncidentStatus}
                onNavigateToMap={(incidentId) => handleNavigate('map', incidentId, 'incident')}
                onResetDemoData={resetDemoIncidents}
              />
            )}
          </main>

          {/* Footer Safety Notice */}
          <footer className="fw-app-footer">
            <div className="fw-footer-content">
              <span>
                <strong>FloodWatch Kerala</strong> — Community-Powered Geospatial Flood Incident Intelligence MVP.
              </span>
              <span className="fw-footer-disclaimer">
                Non-Official Hackathon Demonstration. All records and readings are simulated. For emergencies, dial <strong>112</strong> or <strong>1077</strong>.
              </span>
            </div>
          </footer>
        </div>
      </div>

      {/* Kerala Emergency Hotlines Directory Modal */}
      <HotlineModal
        isOpen={hotlinesModalOpen}
        onClose={() => setHotlinesModalOpen(false)}
      />
    </div>
  );
}

export default App;
