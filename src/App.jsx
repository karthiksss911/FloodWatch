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
import { INITIAL_INCIDENTS, ASSISTANCE_POINTS } from './data/demoData';
import './App.css';

/**
 * FloodWatch Kerala - Application Root Shell
 * Coordinates responsive layout, client-side navigation, shared incident state,
 * and emergency hotline access.
 */
function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [selectedIncidentId, setSelectedIncidentId] = useState(INITIAL_INCIDENTS[0]?.id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hotlinesModalOpen, setHotlinesModalOpen] = useState(false);

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

  // Navigate between views and optionally focus on a specific incident
  const handleNavigate = (tab, incidentId = null) => {
    setActiveTab(tab);
    if (incidentId) {
      setSelectedIncidentId(incidentId);
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
            review_history: [...(item.review_history || []), historyEntry],
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="fw-app-wrapper">
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
                onNavigate={(tab, id) => handleNavigate(tab, id)}
              />
            )}
            {activeTab === 'map' && (
              <MapView
                incidents={incidents}
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={(id) => setSelectedIncidentId(id)}
                onNavigateToReport={() => handleNavigate('report')}
              />
            )}
            {activeTab === 'report' && (
              <ReportView
                onIncidentSubmitted={handleAddIncident}
                onNavigate={(tab, id) => handleNavigate(tab, id)}
              />
            )}
            {activeTab === 'risk' && <RiskView />}
            {activeTab === 'assistance' && (
              <AssistanceView onOpenHotlines={() => setHotlinesModalOpen(true)} />
            )}
            {activeTab === 'authority' && (
              <AuthorityView
                incidents={incidents}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
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
