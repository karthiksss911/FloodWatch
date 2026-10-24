/**
 * FloodWatch Kerala - Official Reference Configurations & Categorizations
 * Centralized metadata configurations for categories, severity levels, and official Kerala emergency hotlines.
 */

export const KOCHI_GEOGRAPHY = {
  name: 'Greater Kochi & Ernakulam District',
  state: 'Kerala',
  center: [9.9816, 76.2999], // Ernakulam Center
  defaultZoom: 12,
  bounds: [
    [9.85, 76.15],
    [10.18, 76.45],
  ],
};

export const SEVERITY_CONFIG = {
  low: {
    label: 'Minor',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    description: 'Ankle-deep or curb-level water. Passable for heavy vehicles with caution.',
  },
  moderate: {
    label: 'Moderate',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    description: 'Knee-deep water or partial blockage. Two-wheelers and small hatchbacks advised to divert.',
  },
  high: {
    label: 'High',
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.3)',
    description: 'Over 1.5 ft water. Small vehicles stalled. Severe congestion and risk of stalling.',
  },
  severe: {
    label: 'Severe / Critical',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    description: 'Impending flood surge, submerged underpass, or impassable road. Avoid entirely.',
  },
};

export const CATEGORIES = [
  { id: 'waterlogging', label: 'Waterlogging / Stagnation', icon: 'droplet' },
  { id: 'road_blockage', label: 'Road Submersion / Blockage', icon: 'shield-alert' },
  { id: 'river_overflow', label: 'River / Canal Overflow', icon: 'waves' },
  { id: 'landslide_risk', label: 'Soil Erosion / Slope Risk', icon: 'mountain' },
  { id: 'tree_fall', label: 'Fallen Tree / Powerline Obstruction', icon: 'alert-triangle' },
];

export const EMERGENCY_HOTLINES = [
  { name: 'District Disaster Management Authority (Ernakulam)', number: '1077', badge: 'Toll-Free 24x7' },
  { name: 'State Emergency Operation Centre (Trivandrum)', number: '1070', badge: 'State HQ' },
  { name: 'Kerala Fire & Rescue Emergency', number: '101', badge: 'Immediate Rescue' },
  { name: 'Kerala Police Command & Control', number: '112', badge: 'Police / Traffic' },
  { name: 'Kerala State Electricity Board (KSEB Hazard Hotline)', number: '1912', badge: 'Fallen Wire / Shock Hazard' },
];
