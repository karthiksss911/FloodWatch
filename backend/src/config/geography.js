/**
 * Greater Kochi Geographic Sub-Basin Definitions
 * Defines monitoring centers, radius bounds, and topography vulnerability factors
 */
export const RISK_ZONES = [
  {
    id: 'zone-aluva-periyar',
    name: 'Aluva - Lower Periyar Basin',
    center: [10.1076, 76.3533],
    radiusKm: 4.5,
    criticalWaterways: ['Periyar River', 'Marthanda Varma Branch'],
    vulnerabilityWeight: 1.45,
    topographyFactor: 'Low-lying flood plain & barrage confluence',
  },
  {
    id: 'zone-kaloor-palarivattom',
    name: 'Kaloor - Palarivattom Metro Corridor',
    center: [9.9984, 76.3012],
    radiusKm: 3.2,
    criticalWaterways: ['Thevara-Perandoor Canal', 'Subhash Bose Canal'],
    vulnerabilityWeight: 1.35,
    topographyFactor: 'High impervious surface, tidal backflow bottleneck',
  },
  {
    id: 'zone-edappally-kalamassery',
    name: 'Edappally - Kalamassery Industrial Belt',
    center: [10.0385, 76.3214],
    radiusKm: 3.8,
    criticalWaterways: ['Edappally Canal', 'Muttar River'],
    vulnerabilityWeight: 1.25,
    topographyFactor: 'Underpass depressions & industrial runoff',
  },
  {
    id: 'zone-vyttila-kadavanthra',
    name: 'Vyttila - Kadavanthra Lowlands',
    center: [9.9665, 76.3078],
    radiusKm: 3.5,
    criticalWaterways: ['Champakkara Canal', 'Rameswaram Canal'],
    vulnerabilityWeight: 1.3,
    topographyFactor: 'Estuarine junction & inter-modal highway sinks',
  },
  {
    id: 'zone-kakkanad-infopark',
    name: 'Kakkanad - Infopark Watershed',
    center: [10.0125, 76.3582],
    radiusKm: 4.0,
    criticalWaterways: ['Chitrapuzha River', 'Kadamprayar Basin'],
    vulnerabilityWeight: 1.15,
    topographyFactor: 'Steep hill slopes into marshy valleys',
  },
];

export const KOCHI_GEOGRAPHY = {
  name: 'Greater Kochi & Ernakulam District',
  center: [9.9816, 76.2999],
  defaultZoom: 12,
  bounds: [
    [9.85, 76.15],
    [10.18, 76.45],
  ],
};
