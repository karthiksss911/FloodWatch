import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import EmergencyBanner from './components/layout/EmergencyBanner';
import HotlineModal from './components/common/HotlineModal';
import OverviewView from './components/views/OverviewView';
import MapView from './components/views/MapView';
import ReportView from './components/views/ReportView';
import RiskView from './components/views/RiskView';
import AssistanceView from './components/views/AssistanceView';
import AuthorityView from './components/views/AuthorityView';
import AtmosphericBackground from './components/layout/AtmosphericBackground';
import { INITIAL_INCIDENTS, ASSISTANCE_POINTS } from './data/demoData';
import './App.css';

const STORAGE_KEY = 'floodwatch_kerala_incidents_v1';

function getInitialIncidents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read saved incidents from localStorage:', err);
  }
  return INITIAL_INCIDENTS;
}

/**
 * FloodWatch Kerala - Application Root Shell
 * Coordinates responsive layout, client-side navigation, shared incident state,
 * and emergency hotline access.
 */
function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [incidents, setIncidents] = useState(getInitialIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState(incidents[0]?.id || INITIAL_INCIDENTS[0]?.id);
  const [selectedAssistancePointId, setSelectedAssistancePointId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hotlinesModalOpen, setHotlinesModalOpen] = useState(false);

  // Shared Risk Intelligence simulation parameters (Requirement 7 & 8)
  const [simulatedRainfall, setSimulatedRainfall] = useState(38.0); // mm/h
  const [decayHalfLife, setDecayHalfLife] = useState(2.0); // hours
  const [rainfallMultiplier, setRainfallMultiplier] = useState(1.2);

  // Persist incidents state to localStorage on every update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    } catch (err) {
      console.warn('Could not persist incidents to localStorage:', err);
    }
  }, [incidents]);

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

  // Add new citizen report to demo session state
  const handleAddIncident = (newIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncidentId(newIncident.id);
  };

  // Update incident verification/status from authority console
  const handleUpdateIncidentStatus = (incidentId, newVerification, newStatus, historyEntry) => {
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === incidentId) {
          return {
            ...item,
            verification_status: newVerification,
            status: newStatus,
            updated_at: new Date().toISOString(),
            review_history: [...(item.review_history || []), historyEntry],
          };
        }
        return item;
      })
    );
  };

  // Reset incidents to default demo dataset
  const handleResetDemoIncidents = () => {
    setIncidents(INITIAL_INCIDENTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INCIDENTS));
    } catch (err) {
      console.warn('Could not reset demo incidents:', err);
    }
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
          shelterCount={ASSISTANCE_POINTS.length}
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
                assistancePoints={ASSISTANCE_POINTS}
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
                onIncidentSubmitted={handleAddIncident}
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
                assistancePoints={ASSISTANCE_POINTS}
                onOpenHotlines={() => setHotlinesModalOpen(true)}
                onNavigateToMap={(pointId) => handleNavigate('map', pointId, 'assistance')}
              />
            )}
            {activeTab === 'authority' && (
              <AuthorityView
                incidents={incidents}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onNavigateToMap={(incidentId) => handleNavigate('map', incidentId, 'incident')}
                onResetDemoData={handleResetDemoIncidents}
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
