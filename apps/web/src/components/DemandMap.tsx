import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng } from '../types';
import { useLanguage } from '../context/LanguageContext';

// Fix for default marker icons in webpack/vite (shared with MapView)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface DemandZone {
  id: string;
  name: string;
  center: LatLng;
  /** Requests per trade type — drives the radius + color when filtered. */
  requests: Record<string, number>;
  workersAvailable: number;
}

export interface DemandMapProps {
  center: LatLng;
  zoom?: number;
  zones: DemandZone[];
  /** Active trade filter ('All Trades' shows the total). */
  filter?: string;
  className?: string;
}

function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

// Styled zoom in/out control pinned bottom-right (matches the product theme
// instead of Leaflet's default top-left control).
function ZoomButtons() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position: 'bottomright' });
    ctrl.addTo(map);
    return () => {
      ctrl.remove();
    };
  }, [map]);
  return null;
}

// Trade -> short color used by the demand circles
const TRADE_COLORS: Record<string, string> = {
  Electrical: '#F59E0B',
  Plumbing: '#3B82F6',
  HVAC: '#0EA5E9',
  Carpentry: '#10B981',
  All: '#FF7448',
};

function zoneIntensity(zone: DemandZone, filter: string): { value: number; color: string } {
  if (filter === 'All Trades') {
    const total = Object.values(zone.requests).reduce((a, b) => a + b, 0);
    return { value: total, color: TRADE_COLORS.All };
  }
  return { value: zone.requests[filter] ?? 0, color: TRADE_COLORS[filter] ?? '#FF7448' };
}

export const DemandMap: React.FC<DemandMapProps> = ({
  center,
  zoom = 12,
  zones,
  filter = 'All Trades',
  className = 'w-full h-full',
}) => {
  const { t } = useLanguage();
  const activeZones = useMemo(
    () =>
      zones
        .map((zone) => {
          const { value, color } = zoneIntensity(zone, filter);
          // No demand for the selected trade → grey out the zone.
          const active = filter === 'All Trades' || (zone.requests[filter] ?? 0) > 0;
          return { zone, value, color, active };
        })
        .sort((a, b) => b.value - a.value),
    [zones, filter]
  );

  const max = Math.max(1, ...activeZones.map((z) => z.value));
  const totalOpen = activeZones.reduce((sum, z) => sum + (z.active ? z.value : 0), 0);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-md ${className}`}>
      {/* key={filter} rebuilds the map when the trade filter changes, which
          clears any open zone popup so the map never lingers stacked over the
          new chart state. */}
      <MapContainer
        key={filter}
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        // Wheel-zoom debounces inside Leaflet and can fire after the map unmounts
        // (route change while zooming), crashing on the removed pane. Zoom stays
        // available via the +/- buttons, double-click and pinch.
        scrollWheelZoom={false}
        zoomAnimation={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Recenter center={center} zoom={zoom} />
        <ZoomButtons />

        {activeZones.map(({ zone, value, color, active }) => (
          <CircleMarker
            key={zone.id}
            center={[zone.center.lat, zone.center.lng]}
            radius={active ? Math.max(14, 40 * Math.sqrt(value / max)) : 10}
            pathOptions={{
              color: active ? color : '#71717A',
              weight: 2,
              fillColor: active ? color : '#71717A',
              fillOpacity: active ? 0.45 : 0.15,
            }}
          >
            {active ? (
              <Tooltip sticky>
                <strong>{zone.name}</strong> — {value} {t('demand.openRequests')}
              </Tooltip>
            ) : null}
            <Popup>
              <div style={{ minWidth: '150px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{zone.name}</div>
                <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.6, marginTop: 4 }}>
                  <div>{t('demand.openRequestsFor', { n: filter })}: <strong>{value}</strong></div>
                  <div>{t('demand.workersOnSite')}: <strong>{zone.workersAvailable}</strong></div>
                  <div style={{ color: value > 0 && zone.workersAvailable < value ? '#B23A2E' : '#10B981', fontWeight: 600 }}>
                    {value > 0 && zone.workersAvailable < value ? `⚡ ${t('demand.routeWorkers')}` : t('demand.coverageAdequate')}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="absolute top-3 left-3 z-[1000]">
        <div className="bg-white/95 dark:bg-[#1B232E]/95 backdrop-blur-md border border-[#F0E5DC] dark:border-[#2A3441] px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF7448] animate-pulse"></span>
          <span className="text-[11px] font-semibold text-[#0F151D] dark:text-[#FBFBFB]">
            {t('demand.liveDemand')} • {filter === 'All Trades' ? t('demand.badgeOpen', { n: totalOpen }) : t('demand.badgeJobs', { n: totalOpen, t: filter.toLowerCase() })}
          </span>
        </div>
      </div>
    </div>
  );
};
