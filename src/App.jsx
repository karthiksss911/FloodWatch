import { useState } from 'react';
import SlimNavRail from './components/layout/SlimNavRail';
import LeftIncidentPanel from './features/dashboard/LeftIncidentPanel';
import MapView from './features/map/MapView';
import DashboardModal from './components/common/DashboardModal';
import HotlineModal from './components/common/HotlineModal';
import SettingsModal from './components/common/SettingsModal';
import ReportView from './features/incidents/ReportView';
import OverviewView from './features/dashboard/OverviewView';
import AssistanceView from './features/assistance/AssistanceView';
import RiskView from './features/risk-intelligence/RiskView';
import AuthorityView from './features/authority/AuthorityView';
import { useIncidents } from './hooks/useIncidents';
import { useAssistancePoints } from './hooks/useAssistancePoints';
import './App.css';

/**
 * FloodWatch Kerala — Map-Centric Operations Dashboard
 * Direct implementation of the Ronas IT delivery dashboard visual design reference:
 * 1. Slim Left Navigation Rail (~68px)
 * 2. Left Information Panel (~340px) with segmented tabs (Active, Investigating, Resolved), search, filters, and cards
 * 3. Large Interactive Map (100% remaining space) with OpenStreetMap, markers, and floating bottom detail card.
 */
function App() {
  const [activeNav, setActiveNav] = useState('map');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [hotlinesModalOpen, setHotlinesModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [subviewModal, setSubviewModal] = useState(null); // 'overview' | 'assistance' | 'risk' | 'authority' | null

  // Live Supabase Incident Management
  const {
    incidents,
    isLoading: incidentsLoading,
    error: incidentsError,
    selectedIncidentId,
    setSelectedIncidentId,
    addIncident,
    updateIncidentStatus,
    refreshIncidents,
  } = useIncidents();

  // Live Supabase Assistance Points & Shelters
  const {
    assistancePoints,
    isLoading: assistanceLoading,
    error: assistanceError,
    selectedAssistancePointId,
    setSelectedAssistancePointId,
    refreshAssistancePoints,
  } = useAssistancePoints();

  // Shared Risk Intelligence simulation parameters
  const [simulatedRainfall, setSimulatedRainfall] = useState(38.0); // mm/h
  const [decayHalfLife, setDecayHalfLife] = useState(2.0); // hours
  const [rainfallMultiplier, setRainfallMultiplier] = useState(1.2);

  // Handle Navigation from Rail
  const handleNavSelect = (navId) => {
    if (navId === 'map') {
      setActiveNav('map');
      setSubviewModal(null);
    } else if (navId === 'report') {
      setReportModalOpen(true);
    } else if (navId === 'hotlines') {
      setHotlinesModalOpen(true);
    } else if (navId === 'settings') {
      setSettingsModalOpen(true);
    } else {
      setActiveNav(navId);
      setSubviewModal(navId);
    }
  };

  const handleSelectIncidentFromCard = (incident) => {
    setSelectedIncidentId(incident.id);
    setSelectedAssistancePointId(null);
  };

  const handleIncidentSubmitted = async (newIncidentData) => {
    try {
      const created = await addIncident(newIncidentData);
      setReportModalOpen(false);
      if (created?.id) {
        setSelectedIncidentId(created.id);
        setSelectedAssistancePointId(null);
      }
    } catch (err) {
      console.error('[App] Failed to add incident:', err);
    }
  };

  const activeIncidentsCount = incidents.filter(
    (i) => i.status === 'active' || (!i.status && i.severity === 'severe')
  ).length;

  return (
    <div className="fw-dashboard-root">
      {/* 1. Slim Left Navigation Rail (~68px) */}
      <SlimNavRail
        activeNav={activeNav}
        onSelectNav={handleNavSelect}
        onOpenReport={() => setReportModalOpen(true)}
        onOpenHotlines={() => setHotlinesModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        activeIncidentCount={activeIncidentsCount}
      />

      {/* 2. Left Information Panel: Flood Incident List (~340-360px) */}
      <LeftIncidentPanel
        incidents={incidents}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={handleSelectIncidentFromCard}
        onOpenReport={() => setReportModalOpen(true)}
        isLoading={incidentsLoading}
        error={incidentsError}
        onRetry={refreshIncidents}
      />

      {/* 3. Large Interactive Map (occupies 100% remaining space) with Floating Bottom Card */}
      <main className="fw-map-main-viewport">
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
          onUpdateIncidentStatus={updateIncidentStatus}
          onOpenHotlines={() => setHotlinesModalOpen(true)}
        />
      </main>

      {/* ============================================================
          Overlay Modals / Drawers for Secondary Workflows
          ============================================================ */}

      {/* Report New Incident Modal */}
      <DashboardModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Flood Incident"
        subtitle="Citizen dispatch & street inundation reporting directly to Supabase"
        icon="plus-circle"
        maxWidth="760px"
      >
        <ReportView
          onIncidentSubmitted={handleIncidentSubmitted}
          onNavigate={(tab, id) => {
            setReportModalOpen(false);
            if (id) setSelectedIncidentId(id);
          }}
        />
      </DashboardModal>

      {/* Situation Overview Modal */}
      <DashboardModal
        isOpen={subviewModal === 'dashboard' || subviewModal === 'overview'}
        onClose={() => {
          setSubviewModal(null);
          setActiveNav('map');
        }}
        title="Situation Overview & Key Indicators"
        subtitle="Monitored Greater Kochi sectors, active hazard counts, and weather summary"
        icon="home"
        maxWidth="1400px"
      >
        <OverviewView
          incidents={incidents}
          assistancePoints={assistancePoints}
          isLoading={incidentsLoading || assistanceLoading}
          error={incidentsError || assistanceError}
          onRetry={() => {
            refreshIncidents();
            refreshAssistancePoints();
          }}
          onNavigate={(tab, id) => {
            setSubviewModal(null);
            setActiveNav('map');
            if (id) setSelectedIncidentId(id);
          }}
        />
      </DashboardModal>

      {/* Assistance Centres Directory Modal */}
      <DashboardModal
        isOpen={subviewModal === 'assistance'}
        onClose={() => {
          setSubviewModal(null);
          setActiveNav('map');
        }}
        title="Assistance Points & Relief Centres"
        subtitle="Registered emergency shelters, medical staging posts, and boat rescue depots"
        icon="heart"
        maxWidth="1200px"
      >
        <AssistanceView
          assistancePoints={assistancePoints}
          isLoading={assistanceLoading}
          error={assistanceError}
          onRetry={refreshAssistancePoints}
          onOpenHotlines={() => setHotlinesModalOpen(true)}
          onNavigateToMap={(pointId) => {
            setSubviewModal(null);
            setActiveNav('map');
            setSelectedAssistancePointId(pointId);
            setSelectedIncidentId(null);
          }}
        />
      </DashboardModal>

      {/* Risk Intelligence Analytics Modal */}
      <DashboardModal
        isOpen={subviewModal === 'risk'}
        onClose={() => {
          setSubviewModal(null);
          setActiveNav('map');
        }}
        title="Explainable Risk Intelligence Engine"
        subtitle="Topographical vulnerability & rainfall accumulation simulation"
        icon="activity"
        maxWidth="1200px"
      >
        <RiskView
          incidents={incidents}
          isLoading={incidentsLoading}
          error={incidentsError}
          onRetry={refreshIncidents}
          simulatedRainfall={simulatedRainfall}
          onSimulatedRainfallChange={setSimulatedRainfall}
          decayHalfLife={decayHalfLife}
          onDecayHalfLifeChange={setDecayHalfLife}
          rainfallMultiplier={rainfallMultiplier}
          onRainfallMultiplierChange={setRainfallMultiplier}
          onNavigate={(tab, id) => {
            setSubviewModal(null);
            setActiveNav('map');
            if (id) setSelectedIncidentId(id);
          }}
        />
      </DashboardModal>

      {/* Authority Operations Console Modal */}
      <DashboardModal
        isOpen={subviewModal === 'authority'}
        onClose={() => {
          setSubviewModal(null);
          setActiveNav('map');
        }}
        title="Authority Incident Verification Console"
        subtitle="Authorized operational triage and citizen report confirmation"
        icon="shield"
        maxWidth="1200px"
      >
        <AuthorityView
          incidents={incidents}
          isLoading={incidentsLoading}
          error={incidentsError}
          onRetry={refreshIncidents}
          onUpdateIncidentStatus={updateIncidentStatus}
          onNavigateToMap={(incidentId) => {
            setSubviewModal(null);
            setActiveNav('map');
            setSelectedIncidentId(incidentId);
            setSelectedAssistancePointId(null);
          }}
        />
      </DashboardModal>

      {/* Kerala Emergency Hotlines Modal */}
      <HotlineModal
        isOpen={hotlinesModalOpen}
        onClose={() => setHotlinesModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}

export default App;
