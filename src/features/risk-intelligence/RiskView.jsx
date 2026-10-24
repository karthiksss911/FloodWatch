import { useMemo } from 'react';
import Icon from '../../components/common/Icon';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { riskService } from '../../services/riskService';

const WEATHER_PRESETS = [
  { label: 'Dry Spell (0 mm/h)', value: 0 },
  { label: 'Passing Showers (15 mm/h)', value: 15 },
  { label: 'Monsoon Surge (38 mm/h)', value: 38 },
  { label: 'Torrential Downpour (65 mm/h)', value: 65 },
];

/**
 * Explainable Risk Intelligence View (Features/Risk-Intelligence)
 * Deterministic scoring engine with dynamic simulation sliders, report deduplication,
 * evidence confidence separation, transparent formula walkthrough, and zone rankings.
 */
export default function RiskView({
  incidents = [],
  isLoading = false,
  error = null,
  onRetry,
  simulatedRainfall = 38.0,
  onSimulatedRainfallChange,
  decayHalfLife = 2.0,
  onDecayHalfLifeChange,
  rainfallMultiplier = 1.2,
  onRainfallMultiplierChange,
  onNavigate,
}) {
  const RISK_THRESHOLDS = riskService.getRiskThresholds();

  // Compute deterministic risk evaluation across all zones
  const evaluatedZones = useMemo(() => {
    return riskService.evaluateAllZones({
      incidents,
      decayHalfLife,
      rainfallMultiplier,
      simulatedGlobalRainfall: simulatedRainfall,
    });
  }, [incidents, decayHalfLife, rainfallMultiplier, simulatedRainfall]);

  // Aggregate regional index
  const aggregateRisk = useMemo(() => {
    return riskService.calculateAggregateRisk(incidents, simulatedRainfall, rainfallMultiplier);
  }, [incidents, simulatedRainfall, rainfallMultiplier]);

  const handleResetCalibration = () => {
    if (typeof onSimulatedRainfallChange === 'function') onSimulatedRainfallChange(38.0);
    if (typeof onDecayHalfLifeChange === 'function') onDecayHalfLifeChange(2.0);
    if (typeof onRainfallMultiplierChange === 'function') onRainfallMultiplierChange(1.2);
  };

  return (
    <div className="fw-risk-view">
      {/* Top Mandatory Disclaimer Banner */}
      <div className="fw-risk-disclaimer-box" role="alert">
        <Icon name="shield-alert" size={20} color="#EF4444" />
        <div className="fw-risk-disc-content">
          <h4 className="fw-risk-disc-title">
            NON-OFFICIAL DEMONSTRATION INTELLIGENCE • EXPERIMENTAL SCORING ENGINE
          </h4>
          <p className="fw-risk-disc-text">
            <strong>Disclaimer:</strong> Experimental estimate based on available reports and
            rainfall inputs. Not an official emergency warning. Absence of reports in an area
            represents <em>data uncertainty</em>, NOT confirmed safe passage. Never label a route
            safe solely due to lack of citizen reports.
          </p>
        </div>
      </div>

      {/* Database Connection Error Notice */}
      {error && (
        <div className="fw-error-banner" role="alert" style={{ marginBottom: '16px' }}>
          <div className="fw-error-lead">
            <Icon name="alert-triangle" size={18} color="#EF4444" />
            <div>
              <strong>Failed to sync database incidents for risk computation</strong>
              <p>{error}</p>
            </div>
          </div>
          {typeof onRetry === 'function' && (
            <Button variant="outline" size="sm" icon="rotate-ccw" onClick={onRetry}>
              Retry Connection
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="fw-loading-banner" role="status" style={{ textAlign: 'center', padding: '12px 0', color: '#94A3B8' }}>
          <span className="fw-spinner" style={{ display: 'inline-block', marginRight: '8px' }} />
          <span>Synchronizing incident reports for risk computation...</span>
        </div>
      )}

      {/* Top Regional Composite Summary Card */}
      <section className="fw-risk-hero-card" aria-label="Regional Risk Index">
        <div className="fw-hero-score-left">
          <div className="fw-score-dial-large">
            <span className="fw-dial-num" style={{ color: aggregateRisk.category.color }}>
              {aggregateRisk.score}
            </span>
            <span className="fw-dial-max">/100</span>
            <span className="fw-dial-label">Composite Index</span>
          </div>
          <div className="fw-hero-score-meta">
            <div className="fw-hero-score-badges">
              <Badge severity={aggregateRisk.category.categoryKey}>
                {aggregateRisk.category.label}
              </Badge>
              <span className="fw-evidence-conf-pill">
                Evidence Confidence: <strong>{aggregateRisk.confidence}%</strong>
              </span>
            </div>
            <h3 className="fw-hero-title">Greater Kochi Regional Flood Risk Estimate</h3>
            <p className="fw-hero-sub">
              Calculated deterministically from {incidents.length} session reports, active
              simulated rainfall ({simulatedRainfall} mm/h), and topography vulnerability.
              Highest active pressure currently at{' '}
              <strong>{aggregateRisk.topZone?.zoneName || 'Edappally Corridor'}</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Model Parameter & Weather Simulation Controls */}
      <Card
        title="Interactive Simulation & Calibration Laboratory"
        subtitle="Test how the deterministic engine responds when weather telemetry or report freshness changes"
        icon={<Icon name="risk" size={18} color="#06B6D4" />}
        badge={<span className="fw-sim-control-badge">SIMULATED DEMO CONTROLLER</span>}
      >
        <div className="fw-simulation-panel">
          {/* Simulated Rainfall Controller */}
          <div className="fw-sim-control-block">
            <div className="fw-param-header">
              <label htmlFor="rainfall-input-slider" className="fw-param-label">
                <Icon name="cloud-rain" size={16} color="#38BDF8" /> Simulated Regional Rainfall:{' '}
                <strong>{simulatedRainfall} mm/h</strong>
              </label>
              <span className="fw-param-hint">
                Controls precipitation intensity fed into the runoff multiplier
              </span>
            </div>
            <input
              id="rainfall-input-slider"
              type="range"
              min="0"
              max="80"
              step="1"
              value={simulatedRainfall}
              onChange={(e) => {
                if (typeof onSimulatedRainfallChange === 'function') {
                  onSimulatedRainfallChange(parseFloat(e.target.value));
                }
              }}
              className="fw-range-input"
            />
            {/* Quick Weather Preset Buttons */}
            <div className="fw-weather-preset-row">
              <span className="fw-preset-label">Demo Weather Scenarios:</span>
              {WEATHER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`fw-preset-chip ${simulatedRainfall === preset.value ? 'active' : ''}`}
                  onClick={() => {
                    if (typeof onSimulatedRainfallChange === 'function') {
                      onSimulatedRainfallChange(preset.value);
                    }
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Weights Grid */}
          <div className="fw-params-grid">
            <div className="fw-param-item">
              <div className="fw-param-header">
                <label htmlFor="decay-slider" className="fw-param-label">
                  Recency Half-Life: <strong>{decayHalfLife.toFixed(1)} hrs</strong>
                </label>
                <span className="fw-param-hint">Older reports decay in hazard weight</span>
              </div>
              <input
                id="decay-slider"
                type="range"
                min="0.5"
                max="6.0"
                step="0.5"
                value={decayHalfLife}
                onChange={(e) => {
                  if (typeof onDecayHalfLifeChange === 'function') {
                    onDecayHalfLifeChange(parseFloat(e.target.value));
                  }
                }}
                className="fw-range-input"
              />
            </div>

            <div className="fw-param-item">
              <div className="fw-param-header">
                <label htmlFor="rain-mult-slider" className="fw-param-label">
                  Rainfall Impact Multiplier: <strong>{rainfallMultiplier.toFixed(1)}x</strong>
                </label>
                <span className="fw-param-hint">Terrain runoff sensitivity factor</span>
              </div>
              <input
                id="rain-mult-slider"
                type="range"
                min="0.8"
                max="2.5"
                step="0.1"
                value={rainfallMultiplier}
                onChange={(e) => {
                  if (typeof onRainfallMultiplierChange === 'function') {
                    onRainfallMultiplierChange(parseFloat(e.target.value));
                  }
                }}
                className="fw-range-input"
              />
            </div>

            <div className="fw-param-reset">
              <Button
                variant="outline"
                size="sm"
                icon="refresh"
                onClick={handleResetCalibration}
              >
                Reset Calibration
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Scoring Thresholds & Evidence Confidence Separation */}
      <div className="fw-risk-doctrine-grid">
        <Card
          title="Documented Scoring Categories & Thresholds"
          subtitle="Clear threshold definitions mapping composite points to impact severity"
          icon={<Icon name="layers" size={18} color="#F59E0B" />}
        >
          <div className="fw-thresholds-table">
            {Object.values(RISK_THRESHOLDS).map((thresh) => (
              <div key={thresh.categoryKey} className="fw-threshold-row">
                <div className="fw-thresh-score-badge" style={{ borderColor: thresh.color, color: thresh.color }}>
                  {thresh.min}–{thresh.max}
                </div>
                <div className="fw-thresh-details">
                  <div className="fw-thresh-header">
                    <strong style={{ color: thresh.color }}>{thresh.label}</strong>
                  </div>
                  <p className="fw-thresh-desc">{thresh.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Separating Hazard Level vs Evidence Confidence"
          subtitle="Why low reporting volume means high uncertainty, not guaranteed safety"
          icon={<Icon name="shield-check" size={18} color="#10B981" />}
        >
          <div className="fw-confidence-explainer">
            <div className="fw-conf-block">
              <h5 className="fw-conf-title">1. Estimated Risk Level (0–100)</h5>
              <p className="fw-conf-text">
                Measures the <em>physical severity</em> of flooding: reported water inundation
                depth, blocked arterial routes, and heavy rainfall runoff pressure.
              </p>
            </div>
            <div className="fw-conf-block">
              <h5 className="fw-conf-title">2. Evidence Confidence Score (0–100%)</h5>
              <p className="fw-conf-text">
                Measures the <em>reliability and density of observations</em>. Supported by
                recency, agreement between independent reports, and authority reviews.
              </p>
            </div>
            <div className="fw-conf-advisory-box">
              <Icon name="alert-triangle" size={16} color="#F59E0B" />
              <span>
                <strong>Crucial Rule:</strong> If an area has 0 reports, its risk score may be low,
                but its confidence is marked as <strong>High Uncertainty</strong>. Absence of evidence
                is never treated as evidence of absence.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Explaining the Deterministic Algorithm */}
      <div className="fw-formula-explainer-card">
        <div className="fw-formula-head">
          <Icon name="activity" size={18} color="#38BDF8" />
          <h3 className="fw-formula-title">Deterministic Mathematical Specification</h3>
        </div>
        <div className="fw-formula-code">
          <code>
            Risk_Score = min(100, [ (Severity_Sum × 0.75) + Density_Pts + Rainfall_Pts ] × Zone_Vulnerability)
            where Severity_Sum = Σ [ Base_Severity_i × 2^(-Δt_i / λ) ]
          </code>
        </div>
        <div className="fw-formula-steps">
          <div className="fw-formula-step">
            <span className="fw-step-tag">1. Deduplication (250m / 30m)</span>
            <p>
              Co-located reports in the same time frame are bundled. Duplicates add an agreement bonus
              to confidence instead of artificially multiplying risk.
            </p>
          </div>
          <div className="fw-formula-step">
            <span className="fw-step-tag">2. Recency Decay (λ = {decayHalfLife.toFixed(1)}h)</span>
            <p>
              Reports older than the half-life exponentially decay in weight. Stale observations
              discount smoothly unless fresh reports are submitted.
            </p>
          </div>
          <div className="fw-formula-step">
            <span className="fw-step-tag">3. Rainfall Amplification</span>
            <p>
              Simulated precipitation ({simulatedRainfall} mm/h) scaled by {rainfallMultiplier}x adds
              up to 35 pts of hydrodynamic runoff pressure.
            </p>
          </div>
          <div className="fw-formula-step">
            <span className="fw-step-tag">4. Topography Vulnerability</span>
            <p>
              Sub-basin coefficients account for natural terrain (river confluence = 1.25x, low underpasses = 1.15x, elevated ridges = 0.85x).
            </p>
          </div>
        </div>
      </div>

      {/* Zone Assessment Breakdown */}
      <Card
        title="Sub-Basin Vulnerability Ranking & Factor Explanations"
        subtitle="7 Greater Kochi monitored basins ranked dynamically by computed hazard score"
        icon={<Icon name="activity" size={18} color="#F59E0B" />}
      >
        <div className="fw-zones-list">
          {evaluatedZones.map((zone, idx) => (
            <div key={zone.zoneId} className="fw-zone-card">
              <div className="fw-zone-rank-col">
                <span className="fw-zone-rank">#{idx + 1}</span>
              </div>

              <div className="fw-zone-main-col">
                <div className="fw-zone-head">
                  <h4 className="fw-zone-name">{zone.zoneName}</h4>
                  <div className="fw-zone-badges">
                    <Badge severity={zone.riskCategory.categoryKey}>
                      {zone.riskCategory.label}
                    </Badge>
                    <span className="fw-zone-conf">
                      Confidence: <strong>{zone.confidenceScore}%</strong>
                    </span>
                  </div>
                </div>

                <div className="fw-zone-meta">
                  <span className="fw-zone-weather">
                    <Icon name="cloud-rain" size={12} />
                    {zone.effectiveRainfall} mm/h ({zone.stationName})
                  </span>
                  <span className="fw-zone-active-inc">
                    <Icon name="warning" size={12} />
                    {zone.activeIncidentsCount} Reports{' '}
                    {zone.duplicateCount > 0 ? `(${zone.duplicateCount} merged)` : ''}
                  </span>
                </div>

                {/* Contributing Factor Contribution Bars */}
                <div className="fw-zone-factor-bars">
                  <div className="fw-factor-progress">
                    <span className="fw-fprogress-label">Incident Severity:</span>
                    <div className="fw-fprogress-track">
                      <div
                        className="fw-fprogress-fill"
                        style={{
                          width: `${Math.min(100, zone.contributingFactors.severityPts * 2.2)}%`,
                          backgroundColor: '#EF4444',
                        }}
                      />
                    </div>
                    <span className="fw-fprogress-val">+{zone.contributingFactors.severityPts} pts</span>
                  </div>

                  <div className="fw-factor-progress">
                    <span className="fw-fprogress-label">Cluster Density:</span>
                    <div className="fw-fprogress-track">
                      <div
                        className="fw-fprogress-fill"
                        style={{
                          width: `${Math.min(100, zone.contributingFactors.densityPts * 4)}%`,
                          backgroundColor: '#06B6D4',
                        }}
                      />
                    </div>
                    <span className="fw-fprogress-val">+{zone.contributingFactors.densityPts} pts</span>
                  </div>

                  <div className="fw-factor-progress">
                    <span className="fw-fprogress-label">Precipitation Runoff:</span>
                    <div className="fw-fprogress-track">
                      <div
                        className="fw-fprogress-fill"
                        style={{
                          width: `${Math.min(100, zone.contributingFactors.rainfallPts * 2.8)}%`,
                          backgroundColor: '#38BDF8',
                        }}
                      />
                    </div>
                    <span className="fw-fprogress-val">+{zone.contributingFactors.rainfallPts} pts</span>
                  </div>
                </div>

                {/* Structured Explainability Narrative */}
                <ul className="fw-zone-factors">
                  {zone.explanationPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>

                <div className="fw-zone-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="map"
                    onClick={() => {
                      if (typeof onNavigate === 'function') {
                        onNavigate('map');
                      }
                    }}
                  >
                    Inspect on Map
                  </Button>
                </div>
              </div>

              {/* Score Metric Column */}
              <div className="fw-zone-score-col">
                <div
                  className="fw-score-circle"
                  style={{ borderColor: zone.riskCategory.color }}
                >
                  <span className="fw-score-val" style={{ color: zone.riskCategory.color }}>
                    {zone.riskScore}
                  </span>
                  <span className="fw-score-denom">/100</span>
                </div>
                <span className="fw-score-label">{zone.riskCategory.categoryKey.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
