import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LatLng, WorkerProfile } from '../types';
import { getRoadRoute } from '../lib/osrm';
import { Avatar } from './Avatar';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const userIcon = new L.DivIcon({
  className: 'custom-user-marker',
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center">
    <span style="width:32px;height:32px;border-radius:50%;background:rgba(59,130,246,0.3);animation:ping 1s cubic-bezier(0,0,0.2,1) infinite;position:absolute"></span>
    <span style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);position:relative;z-index:1;display:flex;align-items:center;justify-content:center">
      <span style="width:6px;height:6px;border-radius:50%;background:white"></span>
    </span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinationIcon = new L.DivIcon({
  className: 'custom-destination-marker',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:3px solid rgba(16,185,129,0.3)">
    <span style="font-size:14px">📍</span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function createWorkerIcon(isSelected: boolean, avatar: string, name = ''): L.DivIcon {
  const inner = avatar
    ? `<img src="${avatar}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />`
    : `<div style="width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#FF7448;color:#fff;font-weight:700;font-size:16px">${(
        name || '?'
      )
        .trim()
        .charAt(0)
        .toUpperCase()}</div>`;
  return new L.DivIcon({
    className: 'custom-worker-marker',
    html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.15s;${isSelected ? 'transform:scale(1.15)' : ''}">
      <div style="width:44px;height:44px;border-radius:50%;padding:2px;${isSelected ? 'background:#FF7448;box-shadow:0 0 0 4px rgba(255,116,72,0.3)' : 'background:white;box-shadow:0 2px 8px rgba(0,0,0,0.2)'}">
        ${inner}
      </div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Component to recenter map when center prop changes (skipped on live dispatch
// routes so the auto-fit bounds are not fought by recentering on GPS ticks).
function RecenterMap({ center, zoom, enabled = true }: { center: LatLng; zoom: number; enabled?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (enabled) map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom, enabled, map]);
  return null;
}

// Clicking empty map space dismisses an open worker selection, so the map can
// never stay open stacked under another window. Marker and popup clicks are
// excluded — those drive selection / actions instead.
function DismissOnMapClick({ onDismiss }: { onDismiss?: () => void }) {
  const map = useMap();
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      const cb = onDismissRef.current;
      if (!cb) return;
      const target = e.originalEvent.target as HTMLElement | null;
      if (target && (target.closest('.leaflet-interactive') || target.closest('.leaflet-popup'))) return;
      cb();
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map]);
  return null;
}

// Fit the map so the route origin and the job site are both in view. Fitting
// against the fixed origin (not the live marker) keeps the view steady while
// the simulated GPS tick moves the marker along the route.
function FitRoute({ from, to }: { from: LatLng; to: LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (!from || !to) return;
    map.fitBounds(
      [
        [Math.min(from.lat, to.lat), Math.min(from.lng, to.lng)],
        [Math.max(from.lat, to.lat), Math.max(from.lng, to.lng)]
      ],
      { padding: [56, 56], maxZoom: 16 }
    );
  }, [from.lat, from.lng, to.lat, to.lng, map]);
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

export interface RoadRouteMeta {
  /** Actual road distance in km (OSRM). */
  distanceKm: number;
  /** Estimated driving time in minutes (OSRM). */
  durationMin: number;
  /** Road-following polyline ([lat, lng]) — lets the tracker drive a GPS tick. */
  points: [number, number][];
}

// Route line that follows actual roads via the public OSRM service instead of a
// straight line. Draws a plain line as an instant placeholder, then swaps in the
// road geometry when the route arrives and refits the map to it. Routes are
// cached module-wide (lib/osrm.ts), so reopening the same dispatch trip reuses
// the geometry instead of re-fetching it. If the request fails (offline / rate
// limit) the placeholder line simply stays.
function RoadRoute({
  from,
  to,
  color = '#FF7448',
  onReady,
}: {
  from: LatLng;
  to: LatLng;
  color?: string;
  onReady?: (meta: RoadRouteMeta) => void;
}) {
  const map = useMap();
  const lineRef = useRef<L.Polyline | null>(null);
  // Keep the latest callback without restarting the fetch on every re-render.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const fromLat = from.lat;
  const fromLng = from.lng;
  const toLat = to.lat;
  const toLng = to.lng;

  useEffect(() => {
    let cancelled = false;

    const draw = (points: [number, number][], fit: boolean) => {
      if (cancelled) return;
      if (lineRef.current) lineRef.current.remove();
      const line = L.polyline(points, {
        color,
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      lineRef.current = line;
      if (fit) {
        map.fitBounds(line.getBounds(), { padding: [56, 56], maxZoom: 16 });
      }
    };

    // Instant placeholder while the road route loads (straight segment).
    draw(
      [
        [fromLat, fromLng],
        [toLat, toLng],
      ],
      true
    );

    getRoadRoute({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng }).then((route) => {
      if (cancelled || !route || !route.points.length) return;
      draw(route.points, true);
      if (onReadyRef.current) {
        onReadyRef.current({
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
          points: route.points
        });
      }
    });

    return () => {
      cancelled = true;
      if (lineRef.current) {
        lineRef.current.remove();
        lineRef.current = null;
      }
    };
  }, [fromLat, fromLng, toLat, toLng, color, map]);

  return null;
}

export interface TripMeta {
  /** Status label shown on the map chip (e.g. "En Route"). */
  label?: string;
  /** Status accent color for the route + chip. */
  color?: string;
  distanceText?: string;
  etaText?: string;
  viaText?: string;
}

interface MapViewProps {
  center: LatLng;
  zoom?: number;
  workers?: WorkerProfile[];
  selectedWorkerId?: string | null;
  onSelectWorker?: (worker: WorkerProfile) => void;
  /** Clear the current selection (closes the card + marker popup). */
  onCloseSelection?: () => void;
  userLocation?: LatLng | null;
  /** Label under the live GPS marker — shows the moving party's name for customers. */
  userLabel?: string;
  userAddress?: string;
  destinationLocation?: LatLng | null;
  destinationLabel?: string;
  /** Fixed route origin (dispatch). Keeps the drawn route + auto-fit anchored to
   *  the trip start while userLocation (the live marker) animates along it. */
  routeStart?: LatLng | null;
  isDispatchRoute?: boolean;
  /** Compact "area, city" label (e.g. "Vasant Vihar, New Delhi") for the badge. */
  regionLabel?: string;
  /** Live trip overlay chip (dispatch). */
  trip?: TripMeta | null;
  className?: string;
  onLocateUser?: () => void;
  isLocating?: boolean;
  onOpenBookingForWorker?: (worker: WorkerProfile) => void;
  /** Called when the road-following route loads (real distance + ETA). */
  onRouteReady?: (meta: RoadRouteMeta) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  center,
  zoom = 14,
  workers = [],
  selectedWorkerId,
  onSelectWorker,
  onCloseSelection,
  userLocation,
  userLabel,
  userAddress,
  destinationLocation,
  destinationLabel,
  routeStart,
  isDispatchRoute = false,
  regionLabel,
  trip,
  className = 'w-full h-full',
  onLocateUser,
  isLocating = false,
  onOpenBookingForWorker,
  onRouteReady,
}) => {
  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
  const routeColor = isDispatchRoute && trip?.color ? trip.color : '#FF7448';
  // The drawn route is anchored to the fixed trip origin when provided.
  const routeOrigin = routeStart ?? userLocation ?? null;
  const onRouteReadyRef = useRef(onRouteReady);
  onRouteReadyRef.current = onRouteReady;

  return (
    <div className={`relative z-0 overflow-hidden rounded-2xl border border-[#F0E5DC] dark:border-[#2A3441] shadow-md ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        // Wheel-zoom debounces inside Leaflet and can fire after the map unmounts
        // (route change while zooming), crashing on the removed pane. Keep zoom
        // available via the control buttons / double-click instead.
        scrollWheelZoom={false}
        zoomAnimation={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <RecenterMap center={center} zoom={zoom} enabled={!isDispatchRoute} />
        <ZoomButtons />
        <DismissOnMapClick onDismiss={onCloseSelection} />

        {/* Auto-fit so route origin + destination are both visible (dispatch). */}
        {isDispatchRoute && routeOrigin && destinationLocation && (
          <FitRoute from={routeOrigin} to={destinationLocation} />
        )}

        {/* User / worker GPS marker (labeled on dispatch) */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={
              isDispatchRoute
                ? new L.DivIcon({
                    className: 'custom-user-marker',
                    html:
                      '<div style="display:flex;flex-direction:column;align-items:center;line-height:1.1">' +
                      '<div style="position:relative;display:flex;align-items:center;justify-content:center">' +
                      '<span style="width:34px;height:34px;border-radius:50%;background:rgba(59,130,246,0.3);animation:ping 1s cubic-bezier(0,0,0.2,1) infinite;position:absolute"></span>' +
                      '<span style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:2px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.3);position:relative;z-index:1"></span>' +
                      '</div>' +
                      '<span style="margin-top:3px;padding:1px 6px;border-radius:6px;background:rgba(24,24,27,0.85);color:#fff;font-size:9px;font-weight:700;white-space:nowrap">' + (userLabel || 'You') + '</span>' +
                      '</div>',
                    iconSize: [34, 46],
                    iconAnchor: [17, 46],
                  })
                : userIcon
            }
          >
            <Popup>
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                {userAddress || 'Your Location'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker for dispatch route (labeled) */}
        {isDispatchRoute && destinationLocation && (
          <Marker
            position={[destinationLocation.lat, destinationLocation.lng]}
            icon={
              new L.DivIcon({
                className: 'custom-destination-marker',
                html:
                  '<div style="display:flex;flex-direction:column;align-items:center;line-height:1.1">' +
                  '<div style="width:26px;height:26px;border-radius:50%;background:#10B981;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:3px solid rgba(16,185,129,0.3);font-size:13px">📍</div>' +
                  '<span style="margin-top:3px;padding:1px 6px;border-radius:6px;background:rgba(16,185,129,0.95);color:#fff;font-size:9px;font-weight:700;white-space:nowrap">Job Site</span>' +
                  '</div>',
                iconSize: [26, 46],
                iconAnchor: [13, 46],
              })
            }
          >
            <Popup>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                {destinationLabel || 'Job Destination'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Road-following dispatch route (OSRM) with straight-line fallback */}
        {isDispatchRoute && destinationLocation && routeOrigin && (
          <RoadRoute
            from={routeOrigin}
            to={destinationLocation}
            color={routeColor}
            onReady={(meta) => onRouteReadyRef.current && onRouteReadyRef.current(meta)}
          />
        )}

        {/* Worker markers — tapping one selects the worker. The floating card
            below the map is the single info window for the selection, so a tap
            never stacks a marker popup over the map while you zoom or browse. */}
        {workers.map((worker) => {
          const isSelected = worker.id === selectedWorkerId;
          return (
            <Marker
              key={worker.id}
              position={[worker.coordinates.lat, worker.coordinates.lng]}
              icon={createWorkerIcon(isSelected, worker.avatar, worker.name)}
              eventHandlers={{
                click: () => {
                  if (onSelectWorker) onSelectWorker(worker);
                },
              }}
            />
          );
        })}
      </MapContainer>

      {/* Floating GPS Recenter Button */}
      {onLocateUser && (
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={onLocateUser}
            disabled={isLocating}
            className="bg-white/95 dark:bg-[#1B232E]/95 backdrop-blur-md border border-[#F0E5DC] dark:border-[#2A3441] px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold text-[#FF7448] hover:bg-[#FFF9F6] dark:hover:bg-[#0F151D] transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${isLocating ? 'animate-spin' : ''}`}>
              {isLocating ? 'progress_activity' : 'my_location'}
            </span>
            <span className="hidden sm:inline">{isLocating ? 'Acquiring GPS...' : 'Locate My Position'}</span>
          </button>
        </div>
      )}

      {/* Map status badge — shows the actual GPS region, never a hardcoded hub */}
      {!isDispatchRoute && (
        <div className="absolute top-4 left-4 z-[1000] max-w-[60%]">
          <div className="bg-white/95 dark:bg-[#1B232E]/95 backdrop-blur-md border border-[#F0E5DC] dark:border-[#2A3441] px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
            <span className="text-xs font-semibold text-[#0F151D] dark:text-[#FBFBFB] truncate">
              {regionLabel || 'Your area'} • {workers.length} verified workers nearby
            </span>
          </div>
        </div>
      )}

      {/* Live trip chip (dispatch route) */}
      {isDispatchRoute && trip && (
        <div className="absolute bottom-4 left-4 z-[1000] max-w-[70%]">
          <div className="bg-white/95 dark:bg-[#1B232E]/95 backdrop-blur-md border border-[#F0E5DC] dark:border-[#2E3946] px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: routeColor, boxShadow: `0 0 0 4px ${routeColor}33` }}
            ></span>
            <div className="min-w-0">
              <p className="font-['Outfit'] font-bold text-xs text-[#0F151D] dark:text-[#FBFBFB] truncate">
                {trip.label || 'Dispatch active'}
                {trip.viaText && (
                  <span className="font-medium text-[#71717A] dark:text-[#A1A1AA] font-sans"> · {trip.viaText}</span>
                )}
              </p>
              {(trip.distanceText || trip.etaText) && (
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  {trip.distanceText}
                  {trip.distanceText && trip.etaText ? ' · ' : ''}
                  {trip.etaText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected worker info card */}
      {selectedWorker && !isDispatchRoute && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 dark:bg-[#232E3A]/95 backdrop-blur-md p-4 rounded-2xl border border-[#F0E5DC] dark:border-[#2E3946] shadow-2xl z-[1000]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar
                src={selectedWorker.avatar}
                name={selectedWorker.name}
                alt={selectedWorker.name}
                className="w-12 h-12 rounded-xl object-cover border border-[#F0E5DC] dark:border-[#2E3946]"
              />
              <div>
                <h4 className="font-['Outfit'] font-bold text-sm text-[#0F151D] dark:text-[#FBFBFB]">
                  {selectedWorker.name}
                </h4>
                <p className="text-xs text-[#FF7448] font-semibold">{selectedWorker.roleTitle}</p>
                <p className="text-[11px] text-[#71717A]">
                  {selectedWorker.distanceMiles} km away • {selectedWorker.driveTimeMin} min ETA
                </p>
              </div>
            </div>
            <button
              onClick={() => onCloseSelection && onCloseSelection()}
              aria-label="Close worker card"
              title="Close"
              className="text-[#71717A] hover:text-[#0F151D] dark:hover:text-[#FBFBFB]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F0E5DC] dark:border-[#2E3946]">
            <button
              onClick={() => onSelectWorker && onSelectWorker(selectedWorker)}
              className="flex-1 py-1.5 bg-[#FFF9F6] dark:bg-[#0F151D] border border-[#F0E5DC] dark:border-[#2E3946] rounded-lg text-xs font-bold text-[#0F151D] dark:text-[#FBFBFB] hover:bg-[#F7EFE8] dark:hover:bg-[#2A3441]"
            >
              View Profile
            </button>
            {onOpenBookingForWorker && (
              <button
                onClick={() => onOpenBookingForWorker(selectedWorker)}
                className="flex-1 py-1.5 bg-[#FF7448] hover:bg-[#FF8D69] text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Book (₹{selectedWorker.hourlyRateLabor}/hr)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
