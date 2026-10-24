import { RISK_ZONES } from '../config/geography.js';
import { backendIncidentService } from './incidentService.js';

export const RISK_THRESHOLDS = {
  lower: { max: 35, label: 'Lower Estimated Risk', color: '#10B981', code: 'low' },
  moderate: { min: 36, max: 65, label: 'Moderate Watch Zone', color: '#F59E0B', code: 'moderate' },
  elevated: { min: 66, max: 80, label: 'Elevated Flood Risk', color: '#F97316', code: 'elevated' },
  severe: { min: 81, max: 100, label: 'Severe Surge Inundation', color: '#EF4444', code: 'severe' },
};

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getRiskCategory(score) {
  if (score <= RISK_THRESHOLDS.lower.max) return RISK_THRESHOLDS.lower;
  if (score <= RISK_THRESHOLDS.moderate.max) return RISK_THRESHOLDS.moderate;
  if (score <= RISK_THRESHOLDS.elevated.max) return RISK_THRESHOLDS.elevated;
  return RISK_THRESHOLDS.severe;
}

class BackendRiskService {
  getZones() {
    return {
      total: RISK_ZONES.length,
      thresholds: RISK_THRESHOLDS,
      data: RISK_ZONES,
    };
  }

  async evaluateRisk({
    simulatedRainfall = null,
    rainfallMultiplier = 1.0,
    decayHalfLife = 2.0,
  } = {}) {
    // Fetch live incidents from Supabase
    const { data: incidents } = await backendIncidentService.getIncidents({ limit: 100 });
    const hasSimulatedRain = simulatedRainfall !== null && !isNaN(Number(simulatedRainfall));
    const effectiveRainfall = hasSimulatedRain ? Number(simulatedRainfall) * Number(rainfallMultiplier) : 0;

    const evaluatedZones = RISK_ZONES.map((zone) => {
      // Find incidents within zone radius
      const nearby = incidents.filter((inc) => {
        if (typeof inc.latitude !== 'number' || typeof inc.longitude !== 'number') return false;
        const d = calculateDistanceKm(
          zone.center[0],
          zone.center[1],
          inc.latitude,
          inc.longitude
        );
        return d <= zone.radiusKm;
      });

      // Calculate incident weight with half-life decay
      const now = Date.now();
      let totalIncidentWeight = 0;

      nearby.forEach((inc) => {
        const ageHours = Math.max(0, (now - new Date(inc.created_at).getTime()) / (1000 * 3600));
        const decay = Math.pow(0.5, ageHours / Math.max(0.1, Number(decayHalfLife)));
        const severityMultiplier =
          inc.severity === 'severe'
            ? 5.0
            : inc.severity === 'high'
            ? 3.5
            : inc.severity === 'moderate'
            ? 2.0
            : 1.0;
        totalIncidentWeight += severityMultiplier * decay;
      });

      // Score formula: incident weight + rainfall if provided
      const incidentComponent = Math.min(60, totalIncidentWeight * 14);
      const rainfallComponent = hasSimulatedRain ? Math.min(40, (effectiveRainfall / 60) * 35) : 0;
      const rawScore = (incidentComponent + rainfallComponent) * zone.vulnerabilityWeight;
      const riskScore = Math.min(100, Math.max(10, Math.round(rawScore)));

      return {
        zoneId: zone.id,
        name: zone.name,
        center: zone.center,
        radiusKm: zone.radiusKm,
        riskScore,
        category: getRiskCategory(riskScore),
        activeIncidentCount: nearby.length,
        telemetryAvailable: false,
        telemetryStatus: 'Live sensor telemetry feed unlinked (Data unavailable)',
        criticalWaterways: zone.criticalWaterways,
        topographyFactor: zone.topographyFactor,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    // Composite aggregate score
    const top3 = evaluatedZones.slice(0, 3);
    const avgScore = top3.length
      ? Math.round(top3.reduce((acc, z) => acc + z.riskScore, 0) / top3.length)
      : 15;

    return {
      aggregateRisk: {
        score: avgScore,
        category: getRiskCategory(avgScore),
        topZone: evaluatedZones[0] || null,
        totalActiveIncidents: incidents.filter((i) => i.status === 'active').length,
        evaluatedAt: new Date().toISOString(),
        telemetryStatus: 'Data unavailable (Sensor network unlinked)',
        disclaimer: 'Experimental calculation for situational awareness based on active community-reported database incidents. Not an official emergency warning.',
      },
      zones: evaluatedZones,
    };
  }
}

export const backendRiskService = new BackendRiskService();
export default backendRiskService;
