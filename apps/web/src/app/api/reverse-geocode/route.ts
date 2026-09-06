import { NextRequest, NextResponse } from 'next/server';

// Builds a compact "area, city/district" label (e.g. "Vasant Vihar, New Delhi")
// from Nominatim/Google address components, so UI badges never have to show a
// full street address. Falls back to whatever components exist.
function buildRegionLabel(address: Record<string, string> | undefined): string | null {
  if (!address || typeof address !== 'object') return null;

  const area =
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.town ||
    address.village ||
    address.county ||
    '';
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.state_district ||
    address.county ||
    '';
  const state = address.state || '';

  const parts = [area, city].filter((p) => p && !state?.startsWith?.(p));
  const uniq: string[] = [];
  for (const p of parts) {
    if (uniq.length === 0 || p !== uniq[uniq.length - 1]) uniq.push(p);
  }
  if (uniq.length === 1 && state && state !== uniq[0]) {
    return `${uniq[0]}, ${state}`;
  }
  return uniq.join(', ') || state || null;
}

// Google address_components are typed arrays of { long_name, short_name, types }.
function regionLabelFromGoogle(components: { long_name: string; short_name: string; types: string[] }[] | undefined): string | null {
  if (!Array.isArray(components)) return null;
  const pick = (types: string[]) => components.find((c) => c.types.some((t) => types.includes(t)))?.long_name;

  const area =
    pick(['sublocality_level_1', 'sublocality', 'neighborhood']) ||
    pick(['administrative_area_level_3']) ||
    '';
  const city = pick(['locality']) || pick(['administrative_area_level_2']) || pick(['postal_town']) || '';
  const state = pick(['administrative_area_level_1']) || '';

  const parts = [area, city].filter((p) => p && p !== state);
  const uniq: string[] = [];
  for (const p of parts) {
    if (!uniq.includes(p)) uniq.push(p);
  }
  if (uniq.length === 1 && state && state !== uniq[0]) {
    return `${uniq[0]}, ${state}`;
  }
  return uniq.join(', ') || state || null;
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng must be numbers' }, { status: 400 });
    }

    // 1) Google Maps (only when a key is configured on the hosted site)
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (mapsKey) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsKey}`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.results?.[0]) {
          const result = data.results[0];
          return NextResponse.json({
            formattedAddress: result.formatted_address,
            placeId: result.place_id,
            region: regionLabelFromGoogle(result.address_components),
          });
        }
      } catch (err) {
        console.warn('Google reverse geocode failed:', err);
      }
    }

    // 2) Free fallback — OpenStreetMap Nominatim (no API key needed). Server-side
    //    so callers never hit rate limits from the browser.
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lng));
      url.searchParams.set('zoom', '14');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('accept-language', 'en');

      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'Coopworks/1.0 (demo prototype)' },
        next: { revalidate: 60 * 60 * 24 }, // cache a day per coordinate
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.display_name) {
          return NextResponse.json({
            formattedAddress: data.display_name,
            placeId: data.place_id ? `nom-${data.place_id}` : undefined,
            region: buildRegionLabel(data.address),
          });
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocode failed:', err);
    }

    // 3) Last resort — no name available, just the coordinates.
    return NextResponse.json({
      formattedAddress: `Near Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (GPS Location)`,
      region: null,
    });
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json({ error: error.message || 'Geocoding failed' }, { status: 500 });
  }
}
