import {
  evaluateAllZones,
  calculateAggregateRisk,
  RISK_ZONES,
  RISK_THRESHOLDS,
  calculateDistanceKm,
} from '../utils/riskEngine.js';

/**
 * Risk Intelligence Service
 * Provides access to deterministic flood risk scoring algorithms and telemetry modeling.
 */
class RiskService {
  /**
   * Evaluates risk across all designated Greater Kochi zones
   */
  evaluateAllZones(params) {
    return evaluateAllZones(params);
  }

  /**
   * Computes regional aggregate composite index
   */
  calculateAggregateRisk(incidents, simulatedRainfall, rainfallMultiplier) {
    return calculateAggregateRisk(incidents, simulatedRainfall, rainfallMultiplier);
  }

  /**
   * Returns list of configured geographical risk sub-basins
   */
  getRiskZones() {
    return RISK_ZONES;
  }

  /**
   * Returns calibrated risk thresholds
   */
  getRiskThresholds() {
    return RISK_THRESHOLDS;
  }

  getDistanceKm(lat1, lon1, lat2, lon2) {
    return calculateDistanceKm(lat1, lon1, lat2, lon2);
  }

  /**
   * Evaluates risk on the backend API if online, falling back to local calculation
   */
  async evaluateRemoteRisk(params, baseUrl = 'http://localhost:5000/api/v1') {
    try {
      const res = await fetch(`${baseUrl}/risk/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          return body.data;
        }
      }
    } catch (err) {
      console.warn('[RiskService] Backend evaluate endpoint unavailable, using local engine:', err.message);
    }
    return null;
  }
}

export const riskService = new RiskService();
export default riskService;
