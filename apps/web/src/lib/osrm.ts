import { LatLng } from '../types';

export interface RoadRouteResult {
  /** Road-following polyline points as [lat, lng]. */
  points: [number, number][];
  /** Actual road distance in km. */
  distanceKm: number;
  /** Estimated driving time in minutes. */
  durationMin: number;
}

/**
 * OSRM public routing service, wrapped with a module-level cache so the same
 * dispatch trip (same from/to coordinates) is not re-fetched every time the
 * tracker is reopened during a session. In-flight requests are deduped so two
 * maps opening the same route share one fetch; negative results are cached
 * briefly so an offline OSRM isn't hammered on every revisit.
 */
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const FAILURE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, { fetchedAt: number; route: RoadRouteResult | null }>();
const inflight = new Map<string, Promise<RoadRouteResult | null>>();

function routeCacheKey(from: LatLng, to: LatLng): string {
  // ~4 decimals ≈ 11 m — enough to collapse repeated taps on the same trip
  // while keeping genuinely different start/end pairs apart.
  const r = (n: number) => n.toFixed(4);
  return `${r(from.lat)},${r(from.lng)}|${r(to.lat)},${r(to.lng)}`;
}

export function getRoadRoute(from: LatLng, to: LatLng): Promise<RoadRouteResult | null> {
  const key = routeCacheKey(from, to);

  const hit = cache.get(key);
  if (hit) {
    const ttl = hit.route ? CACHE_TTL_MS : FAILURE_TTL_MS;
    if (Date.now() - hit.fetchedAt < ttl) return Promise.resolve(hit.route);
    cache.delete(key);
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
        `?overview=full&geometries=geojson&steps=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM route unavailable');
      const json = await res.json();
      if (!json || !Array.isArray(json.routes) || !json.routes.length) return null;

      const geometry = json.routes[0] && json.routes[0].geometry;
      const coords: unknown[] = geometry && Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
      if (!coords.length) return null;

      const route: RoadRouteResult = {
        points: coords.map(
          ([lng, lat]) => [lat, lng] as [number, number]
        ),
        distanceKm: (json.routes[0].distance || 0) / 1000,
        durationMin: Math.max(1, Math.round((json.routes[0].duration || 0) / 60))
      };
      cache.set(key, { fetchedAt: Date.now(), route });
      return route;
    } catch {
      cache.set(key, { fetchedAt: Date.now(), route: null });
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/**
 * Returns the point at `fraction` (0..1) of the total polyline length, walking
 * segment by segment so speed is constant along the road geometry. Falls back
 * to the first point when there is no usable geometry.
 */
export function pointAlongRoute(points: [number, number][], fraction: number): LatLng {
  if (!points || points.length === 0) return { lat: 0, lng: 0 };
  if (points.length === 1) return { lat: points[0][0], lng: points[0][1] };
  if (fraction <= 0) return { lat: points[0][0], lng: points[0][1] };
  if (fraction >= 1) {
    const last = points[points.length - 1];
    return { lat: last[0], lng: last[1] };
  }

  // Cumulative segment lengths.
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [lat1, lng1] = points[i];
    const [lat2, lng2] = points[i + 1];
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const seg = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    segLens.push(seg);
    total += seg;
  }
  if (total <= 0) {
    // Degenerate geometry — just lerp by index fraction.
    const i = Math.min(points.length - 1, Math.floor(fraction * (points.length - 1)));
    return { lat: points[i][0], lng: points[i][1] };
  }

  let target = fraction * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const t = segLens[i] === 0 ? 0 : target / segLens[i];
      const [lat1, lng1] = points[i];
      const [lat2, lng2] = points[i + 1];
      return {
        lat: lat1 + (lat2 - lat1) * Math.max(0, Math.min(1, t)),
        lng: lng1 + (lng2 - lng1) * Math.max(0, Math.min(1, t))
      };
    }
    target -= segLens[i];
  }
  const last = points[points.length - 1];
  return { lat: last[0], lng: last[1] };
}
