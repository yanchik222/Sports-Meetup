// Bay Area cities players can pick as their location, with approximate
// city-center coordinates used to estimate distance between players.

const CITY_COORDINATES: Record<string, [lat: number, lng: number]> = {
  "Alameda, CA": [37.7652, -122.2416],
  "Albany, CA": [37.8869, -122.2978],
  "Antioch, CA": [38.0049, -121.8058],
  "Belmont, CA": [37.5202, -122.2758],
  "Benicia, CA": [38.0494, -122.1586],
  "Berkeley, CA": [37.8715, -122.273],
  "Brentwood, CA": [37.9319, -121.6958],
  "Burlingame, CA": [37.5779, -122.3481],
  "Campbell, CA": [37.2872, -121.95],
  "Castro Valley, CA": [37.6941, -122.0864],
  "Concord, CA": [37.978, -122.0311],
  "Cupertino, CA": [37.323, -122.0322],
  "Daly City, CA": [37.6879, -122.4702],
  "Danville, CA": [37.8216, -121.9999],
  "Dublin, CA": [37.7022, -121.9358],
  "East Palo Alto, CA": [37.4688, -122.1411],
  "Emeryville, CA": [37.8313, -122.2852],
  "Fairfield, CA": [38.2494, -122.04],
  "Foster City, CA": [37.5585, -122.2711],
  "Fremont, CA": [37.5485, -121.9886],
  "Gilroy, CA": [37.0058, -121.5683],
  "Half Moon Bay, CA": [37.4636, -122.4286],
  "Hayward, CA": [37.6688, -122.0808],
  "Lafayette, CA": [37.8858, -122.118],
  "Livermore, CA": [37.6819, -121.768],
  "Los Altos, CA": [37.3852, -122.1141],
  "Los Gatos, CA": [37.2358, -121.9624],
  "Martinez, CA": [38.0194, -122.1341],
  "Menlo Park, CA": [37.453, -122.1817],
  "Mill Valley, CA": [37.906, -122.545],
  "Milpitas, CA": [37.4323, -121.8996],
  "Morgan Hill, CA": [37.1305, -121.6544],
  "Mountain View, CA": [37.3861, -122.0839],
  "Napa, CA": [38.2975, -122.2869],
  "Newark, CA": [37.5297, -122.0402],
  "Novato, CA": [38.1074, -122.5697],
  "Oakland, CA": [37.8044, -122.2712],
  "Orinda, CA": [37.8771, -122.1797],
  "Pacifica, CA": [37.6138, -122.4869],
  "Palo Alto, CA": [37.4419, -122.143],
  "Petaluma, CA": [38.2324, -122.6367],
  "Pittsburg, CA": [38.028, -121.8847],
  "Pleasant Hill, CA": [37.948, -122.0608],
  "Pleasanton, CA": [37.6624, -121.8747],
  "Redwood City, CA": [37.4852, -122.2364],
  "Richmond, CA": [37.9358, -122.3477],
  "San Bruno, CA": [37.6305, -122.4111],
  "San Carlos, CA": [37.5072, -122.2605],
  "San Francisco, CA": [37.7749, -122.4194],
  "San Jose, CA": [37.3382, -121.8863],
  "San Leandro, CA": [37.7249, -122.1561],
  "San Mateo, CA": [37.563, -122.3255],
  "San Rafael, CA": [37.9735, -122.5311],
  "San Ramon, CA": [37.7799, -121.978],
  "Santa Clara, CA": [37.3541, -121.9552],
  "Santa Cruz, CA": [36.9741, -122.0308],
  "Santa Rosa, CA": [38.4404, -122.7141],
  "Saratoga, CA": [37.2638, -122.023],
  "Sausalito, CA": [37.8591, -122.4853],
  "Scotts Valley, CA": [37.0511, -122.0147],
  "South San Francisco, CA": [37.6547, -122.4077],
  "Sunnyvale, CA": [37.3688, -122.0363],
  "Union City, CA": [37.5934, -122.0439],
  "Vallejo, CA": [38.1041, -122.2566],
  "Walnut Creek, CA": [37.9101, -122.0652],
  "Watsonville, CA": [36.9102, -121.7569],
};

export const CITIES = Object.keys(CITY_COORDINATES);

// Straight-line distance in miles between two cities, or undefined if either
// isn't in the list.
export function distanceMiles(from: string, to: string) {
  const a = CITY_COORDINATES[from];
  const b = CITY_COORDINATES[to];
  if (!a || !b) return undefined;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b[0] - a[0]);
  const dLng = toRadians(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a[0])) * Math.cos(toRadians(b[0])) * Math.sin(dLng / 2) ** 2;
  const EARTH_RADIUS_MILES = 3959;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}
