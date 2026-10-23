import { useState } from 'react';
import Icon from '../common/Icon';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

/**
 * Explainable Risk Intelligence View
 * Displays transparent risk scoring formulas, zone breakdown, and configurable model weights.
 */
export default function RiskView() {
  const [decayHalfLife, setDecayHalfLife] = useState(2.0); // hours
  const [rainfallMultiplier, setRainfallMultiplier] = useState(1.4);

  const zones = [
    {
      id: 'zn-edp',
      name: 'Edappally Toll & NH-66 Corridor',
      riskScore: Math.min(100, Math.round(76 * (rainfallMultiplier / 1.4))),
      severity: 'severe',
      confidence: 96,
      rainfallObs: '44.0 mm/h (Kalamassery)',
      activeIncidents: 2,
      factors: [
        'Underpass sump pump failure',
        'Direct confluence with Edappally canal backflow',
        'NH-66 arterial transit bottleneck',
      ],
    },
    {
      id: 'zn-alu',
      name: 'Aluva Periyar Riverbank Basin',
      riskScore: Math.min(100, Math.round(72 * (rainfallMultiplier / 1.4))),
      severity: 'high',
      confidence: 88,
      rainfallObs: '48.6 mm/h (CIAL / Aluva)',
      activeIncidents: 1,
      factors: [
        'Periyar river swell at temple ghats',
        'Upstream barrage outflow increasing',
        'Low-lying riverfront walkway inundated',
      ],
    },
    {
      id: 'zn-kal',
      name: 'Kaloor Junction & Subways',
      riskScore: Math.min(100, Math.round(68 * (rainfallMultiplier / 1.4))),
      severity: 'high',
      confidence: 92,
      rainfallObs: '38.2 mm/h (Kaloor Gauge)',
      activeIncidents: 1,
      factors: [
        'Stadium link underpass flooded to 45cm',
        'Metro pillar drainage overflow',
        'Traffic diversion in place',
      ],
    },
    {
      id: 'zn-mgr',
      name: 'MG Road Commercial Strip',
      riskScore: Math.min(100, Math.round(52 * (rainfallMultiplier / 1.4))),
      severity: 'moderate',
      confidence: 79,
      rainfallObs: '29.5 mm/h (Marine Drive)',
      activeIncidents: 1,
      factors: [
        'Stormwater canal overflowing onto pedestrian sidewalk',
        'Shop basement pumping active',
      ],
    },
    {
      id: 'zn-kkn',
      name: 'Kakkanad & Infopark Expressway',
      riskScore: Math.min(100, Math.round(32 * (rainfallMultiplier / 1.4))),
      severity: 'low',
      confidence: 74,
      rainfallObs: '31.8 mm/h (Infopark Met)',
      activeIncidents: 2,
      factors: [
        'Fallen tree branch cleared on Seaport-Airport Rd',
        'Curb water standing on shoulder',
      ],
    },
  ];

  return (
    <div className="fw-risk-view">
      {/* Top Advisory Banner */}
      <div className="fw-risk-disclaimer-box">
        <Icon name="info" size={18} color="#06B6D4" />
        <div>
          <h4 className="fw-risk-disc-title">Transparent & Non-Official Estimation Model</h4>
          <p className="fw-risk-disc-text">
            Risk scores represent experimental indices based on community reporting density, decay time, and simulated weather radar telemetry. <strong>A lower score does NOT guarantee a road is dry or safe to navigate.</strong>
          </p>
        </div>
      </div>

      {/* Model Parameter Controls */}
      <Card
        title="Dynamic Risk Scoring Calibration"
        subtitle="Adjust environmental weights to observe how the deterministic scoring engine responds"
        icon={<Icon name="risk" size={18} color="#06B6D4" />}
      >
        <div className="fw-params-grid">
          <div className="fw-param-item">
            <div className="fw-param-header">
              <label htmlFor="decay-slider" className="fw-param-label">
                Recency Half-Life: <strong>{decayHalfLife} hrs</strong>
              </label>
              <span className="fw-param-hint">Older reports decay in evidence weight</span>
            </div>
            <input
              id="decay-slider"
              type="range"
              min="0.5"
              max="6.0"
              step="0.5"
              value={decayHalfLife}
              onChange={(e) => setDecayHalfLife(parseFloat(e.target.value))}
              className="fw-range-input"
            />
          </div>

          <div className="fw-param-item">
            <div className="fw-param-header">
              <label htmlFor="rain-slider" className="fw-param-label">
                Rainfall Impact Multiplier: <strong>{rainfallMultiplier}x</strong>
              </label>
              <span className="fw-param-hint">Amplification from local mm/h observation</span>
            </div>
            <input
              id="rain-slider"
              type="range"
              min="0.8"
              max="2.5"
              step="0.1"
              value={rainfallMultiplier}
              onChange={(e) => setRainfallMultiplier(parseFloat(e.target.value))}
              className="fw-range-input"
            />
          </div>

          <div className="fw-param-reset">
            <Button
              variant="secondary"
              size="sm"
              icon="refresh"
              onClick={() => {
                setDecayHalfLife(2.0);
                setRainfallMultiplier(1.4);
              }}
            >
              Reset to Calibrated Baseline
            </Button>
          </div>
        </div>
      </Card>

      {/* Explaining the Algorithm */}
      <div className="fw-formula-explainer-card">
        <div className="fw-formula-head">
          <Icon name="layers" size={18} color="#38BDF8" />
          <h3 className="fw-formula-title">How Risk is Calculated Deterministically:</h3>
        </div>
        <div className="fw-formula-code">
          <code>
            Risk_Score = [ (Cluster_Density × Wd) + (Severity_Sum × Ws) + (Rainfall_Obs × Wr) ] × Agreement_Factor × e^(-Δt / λ)
          </code>
        </div>
        <div className="fw-formula-steps">
          <div className="fw-formula-step">
            <span className="fw-step-tag">1. Density (Wd = 0.35)</span>
            <p>Clusters of reports within a 500m radius increase confidence and base risk.</p>
          </div>
          <div className="fw-formula-step">
            <span className="fw-step-tag">2. Severity (Ws = 0.30)</span>
            <p>Severe road closures weight 4x higher than minor curb standing water.</p>
          </div>
          <div className="fw-formula-step">
            <span className="fw-step-tag">3. Rainfall (Wr = 0.25)</span>
            <p>Sustained precipitation above 30mm/h acts as an environmental amplifier.</p>
          </div>
          <div className="fw-formula-step">
            <span className="fw-step-tag">4. Recency (λ = {decayHalfLife}h)</span>
            <p>Reports older than 4 hours decay unless reinforced by new community submissions.</p>
          </div>
        </div>
      </div>

      {/* Zone Assessment Breakdown */}
      <Card
        title="Greater Kochi Sub-Basin Vulnerability Ranking"
        subtitle="Ranked by computed composite hazard index"
        icon={<Icon name="activity" size={18} color="#F59E0B" />}
      >
        <div className="fw-zones-list">
          {zones.map((zone, idx) => (
            <div key={zone.id} className="fw-zone-card">
              <div className="fw-zone-rank-col">
                <span className="fw-zone-rank">#{idx + 1}</span>
              </div>

              <div className="fw-zone-main-col">
                <div className="fw-zone-head">
                  <h4 className="fw-zone-name">{zone.name}</h4>
                  <div className="fw-zone-badges">
                    <Badge severity={zone.severity} />
                    <span className="fw-zone-conf">Confidence: {zone.confidence}%</span>
                  </div>
                </div>

                <div className="fw-zone-meta">
                  <span className="fw-zone-weather">
                    <Icon name="cloud-rain" size={12} />
                    {zone.rainfallObs}
                  </span>
                  <span className="fw-zone-active-inc">
                    <Icon name="warning" size={12} />
                    {zone.activeIncidents} Active Incidents
                  </span>
                </div>

                <ul className="fw-zone-factors">
                  {zone.factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="fw-zone-score-col">
                <div className="fw-score-circle">
                  <span className="fw-score-val">{zone.riskScore}</span>
                  <span className="fw-score-denom">/100</span>
                </div>
                <span className="fw-score-label">Index</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
