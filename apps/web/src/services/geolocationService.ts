import { LatLng, WorkerProfile } from '../types';

export interface UserLocationResult {
  coordinates: LatLng;
  accuracyMeters: number;
  formattedAddress?: string;
  /** Compact "area, city" label (e.g. "Vasant Vihar, New Delhi") for map badges. */
  region?: string;
  source: 'gps' | 'ip' | 'fallback';
}

// Rough bounding boxes for India's largest metro regions. Used only as an
// offline last resort when reverse geocoding is unreachable, so a badge shows
// "New Delhi" instead of a stale "Pune" or "San Francisco".
const METRO_BOUNDS: { name: string; lat: [number, number]; lng: [number, number] }[] = [
  { name: 'New Delhi', lat: [28.4, 28.9], lng: [76.8, 77.4] },
  { name: 'Mumbai', lat: [18.9, 19.3], lng: [72.75, 73.0] },
  { name: 'Pune', lat: [18.4, 18.7], lng: [73.7, 74.1] },
  { name: 'Bengaluru', lat: [12.8, 13.2], lng: [77.4, 77.8] },
  { name: 'Chennai', lat: [12.8, 13.2], lng: [80.0, 80.4] },
  { name: 'Kolkata', lat: [22.4, 22.7], lng: [88.2, 88.5] },
  { name: 'Hyderabad', lat: [17.2, 17.6], lng: [78.3, 78.7] },
  { name: 'Ahmedabad', lat: [22.9, 23.2], lng: [72.4, 72.8] },
  { name: 'Jaipur', lat: [26.7, 27.1], lng: [75.6, 76.0] },
  { name: 'Lucknow', lat: [26.6, 27.0], lng: [80.7, 81.1] },
  { name: 'Chandigarh', lat: [30.5, 30.9], lng: [76.6, 77.0] },
  { name: 'Surat', lat: [21.0, 21.4], lng: [72.6, 73.0] },
  { name: 'Kochi', lat: [9.8, 10.2], lng: [76.1, 76.5] },
  { name: 'Nagpur', lat: [20.9, 21.3], lng: [78.9, 79.3] },
  { name: 'Indore', lat: [22.5, 22.9], lng: [75.7, 76.1] },
  { name: 'Bhopal', lat: [23.1, 23.4], lng: [77.2, 77.6] },
  { name: 'Patna', lat: [25.4, 25.8], lng: [84.9, 85.3] },
  { name: 'Varanasi', lat: [25.1, 25.5], lng: [82.7, 83.1] },
  { name: 'Guwahati', lat: [25.9, 26.3], lng: [91.5, 91.9] },
  { name: 'Coimbatore', lat: [10.9, 11.2], lng: [76.8, 77.1] },
];

export function guessRegionFromCoords(lat: number, lng: number): string | null {
  const hit = METRO_BOUNDS.find((b) => lat >= b.lat[0] && lat <= b.lat[1] && lng >= b.lng[0] && lng <= b.lng[1]);
  return hit ? hit.name : null;
}

// Default fallback coordinate (New Delhi — near Connaught Place).
export const DEFAULT_COORDINATES: LatLng = {
  lat: 28.6139,
  lng: 77.209
};

/**
 * Calculates Haversine distance in kilometres between two coordinates
 */
export function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Estimates driving time based on urban average travel speed (~20-25 mph + 2 min dispatch base)
 */
export function estimateDriveTimeMinutes(distanceMiles: number): number {
  const time = Math.round((distanceMiles / 22) * 60) + 2;
  return Math.max(3, time);
}

/**
 * Reverse geocodes latitude/longitude via our secure backend proxy
 */
export async function reverseGeocodeLatLng(
  lat: number,
  lng: number
): Promise<{ formattedAddress?: string; region?: string | null }> {
  try {
    const res = await fetch('/api/reverse-geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });
    if (res.ok) {
      const body = await res.json();
      return {
        formattedAddress: body.formattedAddress,
        region: body.region || guessRegionFromCoords(lat, lng),
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }
  return {
    formattedAddress: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    region: guessRegionFromCoords(lat, lng),
  };
}

/**
 * Request real browser GPS location with timeout and fallback
 */
export async function getRealUserLocation(): Promise<UserLocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      resolve({
        coordinates: DEFAULT_COORDINATES,
        accuracyMeters: 50,
        formattedAddress: 'Connaught Place, New Delhi',
        region: 'Connaught Place, New Delhi',
        source: 'fallback'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        let formattedAddress = `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
        let region: string | null = null;
        try {
          const rev = await reverseGeocodeLatLng(coords.lat, coords.lng);
          if (rev.formattedAddress) {
            formattedAddress = rev.formattedAddress;
          }
          region = rev.region || null;
        } catch {
          // fallback strings below
        }

        resolve({
          coordinates: coords,
          accuracyMeters: pos.coords.accuracy || 15,
          formattedAddress,
          region: region || guessRegionFromCoords(coords.lat, coords.lng) || undefined,
          source: 'gps'
        });
      },
      (error) => {
        console.warn('Geolocation error / permission denied:', error.message);
        resolve({
          coordinates: DEFAULT_COORDINATES,
          accuracyMeters: 100,
          formattedAddress: 'Rajiv Chowk, Connaught Place, New Delhi',
          region: 'Connaught Place, New Delhi',
          source: 'fallback'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Convenience helper returning just LatLng
 */
export async function getCurrentPosition(): Promise<LatLng> {
  const result = await getRealUserLocation();
  return result.coordinates;
}

/**
 * Dynamically repositions cooperative workers relative to user's real GPS coordinates
 * so that workers realistically surround the user anywhere in the world!
 */
export function relocateWorkersAroundUser(
  workers: WorkerProfile[],
  userCoordinates: LatLng
): WorkerProfile[] {
  // Realistic radius offsets (~0.4mi to ~2.2mi) in degrees
  const offsets = [
    { dLat: 0.008, dLng: 0.006, xPercent: 52, yPercent: 46 },   // Northeast ~0.6 mi
    { dLat: 0.014, dLng: -0.011, xPercent: 32, yPercent: 30 },  // Northwest ~1.2 mi
    { dLat: -0.009, dLng: 0.015, xPercent: 68, yPercent: 64 },  // Southeast ~1.5 mi
    { dLat: -0.018, dLng: -0.008, xPercent: 38, yPercent: 72 }, // Southwest ~2.0 mi
  ];

  return workers.map((worker, idx) => {
    const offset = offsets[idx % offsets.length];
    const workerLat = userCoordinates.lat + offset.dLat;
    const workerLng = userCoordinates.lng + offset.dLng;
    const distMiles = calculateDistanceMiles(userCoordinates.lat, userCoordinates.lng, workerLat, workerLng);
    const driveTime = estimateDriveTimeMinutes(distMiles);

    return {
      ...worker,
      coordinates: {
        lat: Number(workerLat.toFixed(6)),
        lng: Number(workerLng.toFixed(6))
      },
      mapCoordinates: {
        xPercent: offset.xPercent,
        yPercent: offset.yPercent
      },
      distanceMiles: distMiles,
      driveTimeMin: driveTime
    };
  });
}

export const updateWorkersWithNewUserLocation = relocateWorkersAroundUser;
