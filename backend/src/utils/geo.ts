/**
 * Calculates the straight-line (Haversine) distance in kilometers between two GPS points.
 */
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export const KNOWN_MAHARASHTRA_COORDINATES: Record<string, [number, number]> = {
  // [lat, lng]
  niphad: [20.0768, 74.1089],
  lasalgaon: [20.1418, 74.2255],
  pimpalgaon: [20.1700, 73.9800],
  yeola: [20.0421, 74.4855],
  sinnar: [19.8496, 73.9972],
  dindori: [20.2014, 73.8344],
  nashik: [19.9975, 73.7898],
  pune: [18.5204, 73.8567],
  'pimple gurav': [18.5912, 73.8188],
  'pimpri chinchwad': [18.6298, 73.7997],
  pimpri: [18.6270, 73.8007],
  khadki: [18.5626, 73.8509],
  baramati: [18.1517, 74.5815],
  haveli: [18.4900, 73.8900],
  vashi: [19.0745, 73.0031],
  'navi mumbai': [19.0330, 73.0297],
  panvel: [18.9894, 73.1093],
  kalyan: [19.2403, 73.1305],
  mumbai: [19.0760, 72.8777],
  rahuri: [19.3900, 74.6500],
  ahmednagar: [19.0952, 74.7480],
  solapur: [17.6599, 75.9064],
  satara: [17.6805, 74.0183],
  jalgaon: [21.0077, 75.5626],
};

export function resolveCoordinatesForLocation(locationStr?: string, defaultDistrict = 'Nashik'): [number, number] {
  if (!locationStr || typeof locationStr !== 'string') {
    const defaultKey = defaultDistrict.toLowerCase().trim();
    return KNOWN_MAHARASHTRA_COORDINATES[defaultKey] || [19.9975, 73.7898];
  }

  const clean = locationStr.toLowerCase();
  for (const [name, coords] of Object.entries(KNOWN_MAHARASHTRA_COORDINATES)) {
    if (clean.includes(name)) {
      return coords;
    }
  }

  const distKey = defaultDistrict.toLowerCase().trim();
  return KNOWN_MAHARASHTRA_COORDINATES[distKey] || [19.9975, 73.7898];
}
