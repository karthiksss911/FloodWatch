/**
 * FloodWatch Kerala - Deterministic Risk Intelligence Engine
 * 
 * Computes explainable, reproducible risk scores and evidence confidence metrics
 * for Greater Kochi sub-basins using community reports, recency decay,
 * report deduplication, and simulated rainfall telemetry.
 * 
 * IMPORTANT DISCLAIMER:
 * Experimental estimate based on available reports and rainfall inputs.
 * Not an official emergency warning. Absence of reports in an area represents
 * data uncertainty, NOT confirmed safe passage.
 */

import { RAINFALL_STATIONS } from '../data/demoData';

// Standard Greater Kochi Sub-Basins
export const RISK_ZONES = [
  {
    id: 'zn-edp',
    name: 'Edappally & NH-66 Corridor',
    center: [10.0248, 76.3079],
    radiusKm: 3.5,
    baseVulnerability: 1.15,
    drainageNotes: 'NH underpass sump bottleneck & Edappally canal backflow',
    associatedStationId: 'RNS-02',
  },
  {
    id: 'zn-alu',
    name: 'Aluva & Periyar River Basin',
    center: [10.1076, 76.3533],
    radiusKm: 4.5,
    baseVulnerability: 1.25,
    drainageNotes: 'Periyar river swell at temple ghats & barrage discharge',
    associatedStationId: 'RNS-01',
  },
  {
    id: 'zn-kal',
    name: 'Kaloor & Subways Corridor',
    center: [9.9944, 76.2921],
    radiusKm: 3.0,
    baseVulnerability: 1.1,
    drainageNotes: 'Metro pillar drainage overflow & stadium link underpass',
    associatedStationId: 'RNS-02',
  },
  {
    id: 'zn-mgr',
    name: 'MG Road & Marine Drive',
    center: [9.9729, 76.2842],
    radiusKm: 2.5,
    baseVulnerability: 0.95,
    drainageNotes: 'Urban commercial stormwater overflow into backwaters',
    associatedStationId: 'RNS-03',
  },
  {
    id: 'zn-kdv',
    name: 'Kadavanthra & Giri Nagar Canal Zone',
    center: [9.9602, 76.2995],
    radiusKm: 2.5,
    baseVulnerability: 1.05,
    drainageNotes: 'Perandoor feeder canal tidal backflow at low elevation',
    associatedStationId: 'RNS-03',
  },
  {
    id: 'zn-vyt',
    name: 'Vyttila Mobility Hub & Bypass',
    center: [9.9678, 76.3197],
    radiusKm: 3.0,
    baseVulnerability: 1.0,
    drainageNotes: 'Major arterial transit interchange low-lying ramps',
    associatedStationId: 'RNS-02',
  },
  {
    id: 'zn-kkn',
    name: 'Kakkanad & Infopark Expressway',
    center: [10.0118, 76.3639],
    radiusKm: 4.0,
    baseVulnerability: 0.85,
    drainageNotes: 'Elevated topography with valley road culvert stagnation',
    associatedStationId: 'RNS-04',
  },
];

// Documented Scoring Thresholds (Requirement 9)
export const RISK_THRESHOLDS = {
  high: {
    min: 75,
    max: 100,
    categoryKey: 'high',
    label: 'High Estimated Risk',
    color: '#EF4444',
    badgeVariant: 'danger',
    description: 'Impassable roads, deep underpass inundation (>50cm), or major overflow. Divert immediately.',
  },
  elevated: {
    min: 50,
    max: 74,
    categoryKey: 'elevated',
    label: 'Elevated Estimated Risk',
    color: '#F97316',
    badgeVariant: 'warning',
    description: 'Significant water accumulation (30-50cm) and heavy rainfall. Low vehicles at severe risk of stalling.',
  },
  moderate: {
    min: 25,
    max: 49,
    categoryKey: 'moderate',
    label: 'Moderate Estimated Risk',
    color: '#F59E0B',
    badgeVariant: 'warning',
    description: 'Curb-level water (15-30cm), slow transit, partial road obstruction. Two-wheelers navigate with caution.',
  },
  lower: {
    min: 0,
    max: 24,
    categoryKey: 'lower',
    label: 'Lower Estimated Risk',
    color: '#10B981',
    badgeVariant: 'emerald',
    description: 'Minor water stagnation or limited evidence. Does NOT guarantee dry roads.',
  },
};

/**
 * Great-circle distance between two GPS coordinates in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

/**
 * Deduplicate reports submitted within 250m and 30m of each other (Requirement 3)
 */
export function deduplicateReports(reports) {
  const independentClusters = [];
  const duplicates = [];

  for (const report of reports) {
    let matchedCluster = null;

    for (const cluster of independentClusters) {
      const distKm = calculateDistanceKm(
        report.latitude,
        report.longitude,
        cluster.primary.latitude,
        cluster.primary.longitude
      );

      const time1 = new Date(report.observed_at || report.created_at || Date.now()).getTime();
      const time2 = new Date(cluster.primary.observed_at || cluster.primary.created_at || Date.now()).getTime();
      const diffMin = Math.abs(time1 - time2) / (1000 * 60);

      // Same category, within 250 meters and 30 minutes
      if (distKm <= 0.25 && diffMin <= 30 && report.category === cluster.primary.category) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.duplicates.push(report);
      duplicates.push(report);
    } else {
      independentClusters.push({
        primary: report,
        duplicates: [],
      });
    }
  }

  return { independentClusters, duplicateCount: duplicates.length };
}

/**
 * Maps risk score to defined threshold category (Requirement 9)
 */
export function getRiskCategory(score) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped >= 75) return RISK_THRESHOLDS.high;
  if (clamped >= 50) return RISK_THRESHOLDS.elevated;
  if (clamped >= 25) return RISK_THRESHOLDS.moderate;
  return RISK_THRESHOLDS.lower;
}

/**
 * Computes deterministic risk and confidence for a single geographic zone
 */
export function evaluateZoneRisk({
  zone,
  incidents,
  decayHalfLife = 2.0, // hours
  rainfallMultiplier = 1.0,
  simulatedGlobalRainfall = null, // optional global mm/h override
}) {
  // 1. Gather incidents within the zone boundary
  const zoneIncidents = incidents.filter((inc) => {
    if (typeof inc.latitude !== 'number' || typeof inc.longitude !== 'number') return false;
    const dist = calculateDistanceKm(inc.latitude, inc.longitude, zone.center[0], zone.center[1]);
    return dist <= zone.radiusKm;
  });

  // 2. Perform duplicate detection on zone reports (Requirement 3)
  const { independentClusters, duplicateCount } = deduplicateReports(zoneIncidents);

  // 3. Resolve active rainfall input
  let effectiveRainfall;
  let stationName;

  if (simulatedGlobalRainfall !== null && simulatedGlobalRainfall !== undefined) {
    effectiveRainfall = Number(simulatedGlobalRainfall);
    stationName = 'Simulated Weather Radar Control';
  } else {
    const station = RAINFALL_STATIONS.find((s) => s.id === zone.associatedStationId) || RAINFALL_STATIONS[0];
    effectiveRainfall = station ? station.current_mm_hr : 30.0;
    stationName = station ? station.station_name : 'Regional Station (Demo)';
  }

  const amplifiedRainfall = effectiveRainfall * Math.max(0.5, Math.min(3.0, rainfallMultiplier));

  // 4. Calculate severity contribution and recency decay (Requirement 2)
  let severityScoreSum = 0;
  let totalRecencyWeight = 0;
  const nowMs = Date.now();
  let verifiedCount = 0;

  independentClusters.forEach((cluster) => {
    const primary = cluster.primary;
    if (primary.verification_status === 'demo_reviewed' || primary.verification_status === 'demo_community_confirmed') {
      verifiedCount++;
    }

    // Severity base points
    let sevBase = 8;
    if (primary.severity === 'severe') sevBase = 28;
    else if (primary.severity === 'high') sevBase = 18;
    else if (primary.severity === 'moderate') sevBase = 11;
    else if (primary.severity === 'low') sevBase = 5;

    // Additional water depth bonus
    if (primary.water_depth_cm && primary.water_depth_cm > 40) {
      sevBase += Math.min(10, Math.round((primary.water_depth_cm - 40) / 4));
    }

    // Exponential recency decay: 2^(-deltaT / halfLife)
    const reportTimeMs = new Date(primary.observed_at || primary.created_at || nowMs).getTime();
    const ageHours = Math.max(0, (nowMs - reportTimeMs) / (1000 * 60 * 60));
    const recencyWeight = Math.pow(2, -ageHours / Math.max(0.5, decayHalfLife));

    totalRecencyWeight += recencyWeight;
    severityScoreSum += sevBase * recencyWeight;
  });

  // 5. Cluster Density Contribution (up to 25 pts)
  const clusterCount = independentClusters.length;
  const densityPts = Math.min(25, clusterCount * 8);

  // 6. Rainfall Impact Contribution (up to 35 pts)
  let rainfallPts = 0;
  if (amplifiedRainfall > 0) {
    if (amplifiedRainfall < 10) {
      rainfallPts = amplifiedRainfall * 0.4;
    } else if (amplifiedRainfall < 30) {
      rainfallPts = 4 + (amplifiedRainfall - 10) * 0.6;
    } else if (amplifiedRainfall < 50) {
      rainfallPts = 16 + (amplifiedRainfall - 30) * 0.55;
    } else {
      rainfallPts = 27 + Math.min(8, (amplifiedRainfall - 50) * 0.3);
    }
  }

  // 7. Base Composite Hazard Score
  const rawScore = (severityScoreSum * 0.75 + densityPts + rainfallPts) * zone.baseVulnerability;
  const finalRiskScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const riskCategory = getRiskCategory(finalRiskScore);

  // 8. Confidence in Evidence (Separate from Risk Level - Requirement 4)
  let confidenceScore = 15; // Baseline minimum due to uncertainty
  if (clusterCount > 0) {
    // Report volume confidence
    confidenceScore += Math.min(40, clusterCount * 14);
    // Verified sources bonus
    confidenceScore += Math.min(20, verifiedCount * 10);
    // Corroboration / duplicates bonus
    if (duplicateCount > 0) {
      confidenceScore += Math.min(15, duplicateCount * 7.5);
    }
    // Recency preservation factor
    const avgRecency = clusterCount > 0 ? totalRecencyWeight / clusterCount : 0;
    confidenceScore = Math.round(confidenceScore * (0.6 + 0.4 * avgRecency));
  } else {
    // No reports in area: confidence remains low/uncertain (Requirement 11)
    confidenceScore = Math.min(30, 15 + Math.round(effectiveRainfall / 5));
  }
  confidenceScore = Math.max(10, Math.min(98, confidenceScore));

  // 9. Structured Explainability Narrative (Requirement 5)
  const explanationPoints = [];

  if (clusterCount === 0) {
    explanationPoints.push(
      'No active citizen reports logged in this sub-basin within the active monitoring window.'
    );
    explanationPoints.push(
      'Score is driven solely by baseline simulated precipitation and terrain vulnerability.'
    );
    explanationPoints.push(
      '⚠️ UNCERTAINTY NOTICE: Absence of reports does NOT guarantee roads are safe or dry.'
    );
  } else {
    explanationPoints.push(
      `${clusterCount} independent report clusters (${zoneIncidents.length} total submissions${
        duplicateCount > 0 ? `, ${duplicateCount} co-located duplicates filtered` : ''
      }).`
    );

    const severeFound = zoneIncidents.filter((i) => i.severity === 'severe').length;
    const highFound = zoneIncidents.filter((i) => i.severity === 'high').length;
    if (severeFound > 0) {
      explanationPoints.push(`${severeFound} severe/impassable blockage report(s) actively elevate hazard weight.`);
    } else if (highFound > 0) {
      explanationPoints.push(`${highFound} high-risk report(s) indicating deep water or stalled vehicle risk.`);
    }

    if (amplifiedRainfall >= 30) {
      explanationPoints.push(
        `Heavy simulated rainfall (${amplifiedRainfall.toFixed(1)} mm/h via ${stationName}) amplifies runoff index.`
      );
    } else if (amplifiedRainfall > 0) {
      explanationPoints.push(
        `Moderate simulated rainfall (${amplifiedRainfall.toFixed(1)} mm/h) contributing +${Math.round(rainfallPts)} pts.`
      );
    }

    explanationPoints.push(
      `Zone drainage characteristic: ${zone.drainageNotes}.`
    );

    if (confidenceScore >= 75) {
      explanationPoints.push(`High evidence confidence (${confidenceScore}%) backed by multiple recent citizen reports.`);
    } else if (confidenceScore >= 45) {
      explanationPoints.push(`Moderate confidence (${confidenceScore}%) due to limited confirmation reports.`);
    } else {
      explanationPoints.push(`Low confidence (${confidenceScore}%); field data is sparse or aging.`);
    }
  }

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    center: zone.center,
    radiusKm: zone.radiusKm,
    riskScore: finalRiskScore,
    riskCategory,
    confidenceScore,
    activeIncidentsCount: zoneIncidents.length,
    independentClusterCount: clusterCount,
    duplicateCount,
    effectiveRainfall,
    amplifiedRainfall,
    stationName,
    contributingFactors: {
      severityPts: Math.round(severityScoreSum * 0.75),
      densityPts: Math.round(densityPts),
      rainfallPts: Math.round(rainfallPts),
      baseVulnerability: zone.baseVulnerability,
    },
    drainageNotes: zone.drainageNotes,
    explanationPoints,
  };
}

/**
 * Evaluates risk across all predefined Greater Kochi zones
 */
export function evaluateAllZones({
  incidents,
  decayHalfLife = 2.0,
  rainfallMultiplier = 1.0,
  simulatedGlobalRainfall = null,
}) {
  return RISK_ZONES.map((zone) =>
    evaluateZoneRisk({
      zone,
      incidents,
      decayHalfLife,
      rainfallMultiplier,
      simulatedGlobalRainfall,
    })
  ).sort((a, b) => b.riskScore - a.riskScore); // Highest risk first
}

/**
 * Computes top-level Greater Kochi aggregate risk index for dashboard overview
 */
export function calculateAggregateRisk(incidents, simulatedGlobalRainfall = null, rainfallMultiplier = 1.0) {
  const evaluatedZones = evaluateAllZones({
    incidents,
    decayHalfLife: 2.0,
    rainfallMultiplier,
    simulatedGlobalRainfall,
  });

  if (evaluatedZones.length === 0) {
    return {
      score: 15,
      category: RISK_THRESHOLDS.lower,
      confidence: 20,
      topZone: null,
      evaluatedZones: [],
    };
  }

  // Top zone drives the highest priority alert
  const topZone = evaluatedZones[0];

  // Weighted average of top 3 zones
  const top3 = evaluatedZones.slice(0, 3);
  const avgScore = Math.round(
    top3.reduce((sum, z, idx) => sum + z.riskScore * (1 - idx * 0.25), 0) /
      top3.reduce((sum, _, idx) => sum + (1 - idx * 0.25), 0)
  );

  return {
    score: avgScore,
    category: getRiskCategory(avgScore),
    confidence: topZone.confidenceScore,
    topZone,
    evaluatedZones,
  };
}
