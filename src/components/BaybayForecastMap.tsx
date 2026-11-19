import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  GeolocateControl,
  ScaleControl,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Mountain, Radar } from 'lucide-react';
import type { Barangay, DecisionStatus } from '../types/database';

// Configure MapLibre GL v6 Web Worker URL explicitly so vector tiles & GeoJSON work in both Vite dev & Vercel production
setWorkerUrl(maplibreWorkerUrl);

export type ForecastLayer = 'rain' | 'soil' | 'flood' | 'suitability';

export interface BarangayZoneFeatureData {
  barangayId: string;
  code: string;
  name: string;
  decision: DecisionStatus;
  confidence: 'low' | 'medium' | 'high';
  rainMm: number;
  soilMoisturePct: number;
  floodRisk: 'low' | 'medium' | 'high';
  elevationM: number;
  soilTexture: string;
  centerLng: number;
  centerLat: number;
}

interface BaybayForecastMapProps {
  zones: BarangayZoneFeatureData[];
  selectedBarangayId: string;
  onSelectZone: (barangayId: string) => void;
  layer: ForecastLayer;
  fieldLng: number;
  fieldLat: number;
  fieldName: string;
  isDark: boolean;
  isOnline: boolean;
  flyToTrigger: number;
}

function getZoneColor(z: BarangayZoneFeatureData, layer: ForecastLayer): string {
  if (layer === 'rain') {
    if (z.rainMm >= 55) return '#dc2626';
    if (z.rainMm >= 40) return '#d97706';
    if (z.rainMm >= 30) return '#2563eb';
    return '#0284c7';
  }
  if (layer === 'soil') {
    if (z.soilMoisturePct >= 55) return '#1d4ed8';
    if (z.soilMoisturePct >= 40) return '#0d9488';
    return '#65a30d';
  }
  if (layer === 'flood') {
    if (z.floodRisk === 'high') return '#dc2626';
    if (z.floodRisk === 'medium') return '#d97706';
    return '#16a34a';
  }
  if (z.decision === 'avoid') return '#dc2626';
  if (z.decision === 'wait') return '#d97706';
  return '#16a34a';
}

function getZoneReading(z: BarangayZoneFeatureData, layer: ForecastLayer): string {
  if (layer === 'rain') return `${z.rainMm} mm`;
  if (layer === 'soil') return `${z.soilMoisturePct}%`;
  if (layer === 'flood') return z.floodRisk.toUpperCase();
  return z.decision.toUpperCase();
}

function buildZonesGeoJson(
  zones: BarangayZoneFeatureData[],
  layer: ForecastLayer
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const radiusLng = 0.0078;
  const radiusLat = 0.0062;

  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = zones.map((z, idx) => {
    const ring: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      ring.push([
        z.centerLng + Math.cos(angle) * radiusLng,
        z.centerLat + Math.sin(angle) * radiusLat,
      ]);
    }
    ring.push(ring[0]);

    return {
      type: 'Feature',
      id: idx + 1,
      properties: {
        barangayId: z.barangayId,
        name: z.name,
        fillColor: getZoneColor(z, layer),
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    };
  });

  return { type: 'FeatureCollection', features };
}

export function buildBarangayZones(barangays: Barangay[]): BarangayZoneFeatureData[] {
  const presets: Record<
    string,
    {
      decision: DecisionStatus;
      confidence: 'low' | 'medium' | 'high';
      rainMm: number;
      soilMoisturePct: number;
      floodRisk: 'low' | 'medium' | 'high';
    }
  > = {
    Gabas: { decision: 'wait', confidence: 'medium', rainMm: 42, soilMoisturePct: 38, floodRisk: 'medium' },
    Pangasugan: { decision: 'go', confidence: 'high', rainMm: 24, soilMoisturePct: 31, floodRisk: 'low' },
    Hilapnitan: { decision: 'go', confidence: 'high', rainMm: 34, soilMoisturePct: 41, floodRisk: 'medium' },
    Caridad: { decision: 'avoid', confidence: 'high', rainMm: 58, soilMoisturePct: 64, floodRisk: 'high' },
    Plaridel: { decision: 'avoid', confidence: 'high', rainMm: 62, soilMoisturePct: 68, floodRisk: 'high' },
    Bubon: { decision: 'go', confidence: 'high', rainMm: 28, soilMoisturePct: 33, floodRisk: 'low' },
    Guadalupe: { decision: 'wait', confidence: 'low', rainMm: 39, soilMoisturePct: 44, floodRisk: 'medium' },
  };

  return barangays.map((b) => {
    const p = presets[b.name] ?? {
      decision: 'wait',
      confidence: 'medium',
      rainMm: 38,
      soilMoisturePct: 40,
      floodRisk: 'medium',
    };
    return {
      barangayId: b.id,
      code: b.code,
      name: b.name,
      decision: p.decision,
      confidence: p.confidence,
      rainMm: p.rainMm,
      soilMoisturePct: p.soilMoisturePct,
      floodRisk: p.floodRisk,
      elevationM: b.elevation_m,
      soilTexture: b.soil_texture,
      centerLng: b.center_lng,
      centerLat: b.center_lat,
    };
  });
}

function getMapLibreStyle(
  basemap: 'vector' | 'satellite',
  isDark: boolean
): string | StyleSpecification {
  if (basemap === 'vector') {
    // Official open MapLibre GL v8 vector tile styles (zero API key required)
    return isDark
      ? 'https://tiles.openfreemap.org/styles/fiord'
      : 'https://tiles.openfreemap.org/styles/liberty';
  }

  return {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© Esri, Maxar, Earthstar Geographics',
      },
      'esri-labels': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
      },
    },
    layers: [
      { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite' },
      { id: 'esri-labels-layer', type: 'raster', source: 'esri-labels' },
    ],
  };
}

export function BaybayForecastMap({
  zones,
  selectedBarangayId,
  onSelectZone,
  layer,
  fieldLng,
  fieldLat,
  fieldName,
  isDark,
  isOnline,
  flyToTrigger,
}: BaybayForecastMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const fieldMarkerRef = useRef<Marker | null>(null);
  const zoneMarkersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);
  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;

  const [basemap, setBasemap] = useState<'vector' | 'satellite'>('vector');
  const [is3dTilt, setIs3dTilt] = useState(false);
  const [radarTileUrl, setRadarTileUrl] = useState<string | null>(null);
  const [radarActive, setRadarActive] = useState(false);

  const geojson = useMemo(() => buildZonesGeoJson(zones, layer), [zones, layer]);

  // Fetch live RainViewer precipitation radar frame (free public API, zero key needed)
  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.radar?.past?.length) return;
        const latest = data.radar.past[data.radar.past.length - 1];
        if (latest?.path) {
          setRadarTileUrl(
            `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`
          );
        }
      })
      .catch(() => {
        // Offline or restricted — GeoJSON forecast zones still render
      });
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  // Sync GeoJSON forecast polygons + live RainViewer radar onto MapLibre GL
  const syncForecastLayers = (map: MapLibreMap) => {
    if (!map.getSource('agapay-zones')) {
      map.addSource('agapay-zones', {
        type: 'geojson',
        data: geojson,
      });
      map.addLayer({
        id: 'agapay-zones-fill',
        type: 'fill',
        source: 'agapay-zones',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': 0.34,
        },
      });
      map.addLayer({
        id: 'agapay-zones-outline',
        type: 'line',
        source: 'agapay-zones',
        paint: {
          'line-color': ['get', 'fillColor'],
          'line-width': [
            'case',
            ['==', ['get', 'barangayId'], selectedBarangayId],
            3.5,
            1.5,
          ],
        },
      });

      map.on('click', 'agapay-zones-fill', (e: MapLayerMouseEvent) => {
        const brgyId = e.features?.[0]?.properties?.barangayId as string | undefined;
        if (brgyId) onSelectZoneRef.current(brgyId);
      });
      map.on('mouseenter', 'agapay-zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'agapay-zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    } else {
      const src = map.getSource('agapay-zones') as GeoJSONSource;
      src.setData(geojson);
      if (map.getLayer('agapay-zones-outline')) {
        map.setPaintProperty('agapay-zones-outline', 'line-width', [
          'case',
          ['==', ['get', 'barangayId'], selectedBarangayId],
          3.8,
          1.5,
        ]);
      }
    }

    const hasRadarLayer = Boolean(map.getLayer('agapay-rain-radar-layer'));
    if (layer === 'rain' && radarTileUrl) {
      if (!map.getSource('agapay-rain-radar')) {
        map.addSource('agapay-rain-radar', {
          type: 'raster',
          tiles: [radarTileUrl],
          tileSize: 256,
          maxzoom: 7, // RainViewer free radar tiles cap at z7; MapLibre smoothly overzooms beyond z7
        });
      }
      if (!hasRadarLayer) {
        map.addLayer(
          {
            id: 'agapay-rain-radar-layer',
            type: 'raster',
            source: 'agapay-rain-radar',
            paint: { 'raster-opacity': 0.55 },
          },
          'agapay-zones-fill'
        );
      } else {
        map.setLayoutProperty('agapay-rain-radar-layer', 'visibility', 'visible');
      }
      setRadarActive(true);
    } else {
      if (hasRadarLayer) {
        map.setLayoutProperty('agapay-rain-radar-layer', 'visibility', 'none');
      }
      setRadarActive(false);
    }
  };

  // Initialize official MapLibre GL JS Map with NavigationControl, GeolocateControl & ScaleControl
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      center: [fieldLng || 124.8005, fieldLat || 10.7145],
      zoom: 12.0,
      minZoom: 9.5,
      maxZoom: 17,
      pitch: is3dTilt ? 48 : 0,
      attributionControl: false,
      style: getMapLibreStyle(basemap, isDark),
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right'
    );
    map.addControl(new ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-right');

    map.on('load', () => {
      syncForecastLayers(map);
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      fieldMarkerRef.current?.remove();
      fieldMarkerRef.current = null;
      zoneMarkersRef.current.forEach((m) => m.remove());
      zoneMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basemap, isDark]);

  // Toggle 3D perspective tilt smoothly via MapLibre easeTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ pitch: is3dTilt ? 48 : 0, bearing: is3dTilt ? -12 : 0, duration: 450 });
  }, [is3dTilt]);

  // Sync GeoJSON forecast layers & RainViewer radar
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      syncForecastLayers(map);
    } else {
      map.once('load', () => syncForecastLayers(map));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson, selectedBarangayId, layer, radarTileUrl]);

  // Interactive MapLibre Markers for each Baybay City barangay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    zoneMarkersRef.current.forEach((m) => m.remove());
    zoneMarkersRef.current = [];

    zones.forEach((z) => {
      const color = getZoneColor(z, layer);
      const reading = getZoneReading(z, layer);
      const isSelected = z.barangayId === selectedBarangayId;

      const el = document.createElement('button');
      el.type = 'button';
      el.style.cssText = `
        display:flex;align-items:center;gap:4px;
        background:${isSelected ? color : 'rgba(17,19,18,0.84)'};
        color:#ffffff;
        border:2px solid ${color};
        border-radius:999px;
        padding:3px 8px;
        font-size:10px;
        font-weight:700;
        cursor:pointer;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.32);
      `;
      el.innerHTML = `<span>${z.name}</span><span style="opacity:.95;">· ${reading}</span>`;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelectZoneRef.current(z.barangayId);
      });

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([z.centerLng, z.centerLat])
        .addTo(map);
      zoneMarkersRef.current.push(marker);
    });
  }, [zones, layer, selectedBarangayId, basemap, isDark]);

  // Farmer's active field pin using MapLibre Marker + Popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    fieldMarkerRef.current?.remove();
    const el = document.createElement('div');
    el.style.cursor = 'pointer';
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:5px;background:#111312;color:#ffffff;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:800;box-shadow:0 4px 14px rgba(0,0,0,0.4);border:2px solid #4fb67f;white-space:nowrap;">
        <span style="width:8px;height:8px;border-radius:999px;background:#4fb67f;display:inline-block;"></span>
        <span>${fieldName}</span>
      </div>
    `;

    const popup = new Popup({ offset: 22, closeButton: false }).setHTML(
      `<div style="font-family:DM Sans,sans-serif;font-size:12px;color:#111312;"><strong>${fieldName}</strong><br/>Baybay City, Leyte</div>`
    );

    fieldMarkerRef.current = new Marker({
      element: el,
      anchor: 'bottom',
      offset: [0, -18],
    })
      .setLngLat([fieldLng || 124.7962, fieldLat || 10.7285])
      .setPopup(popup)
      .addTo(map);
  }, [fieldLng, fieldLat, fieldName, basemap, isDark]);

  // Smooth flyTo when selecting a barangay or tapping "My field"
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const z = zones.find((x) => x.barangayId === selectedBarangayId);
    if (z) {
      map.flyTo({
        center: [z.centerLng, z.centerLat],
        zoom: 12.6,
        duration: 600,
      });
    }
  }, [selectedBarangayId, flyToTrigger, zones]);

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div ref={containerRef} className="h-[340px] w-full sm:h-[380px]" />

      {/* Top-Left MapLibre Controls: Vector/Satellite + 3D Tilt + Live Radar Pill */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBasemap((b) => (b === 'vector' ? 'satellite' : 'vector'))}
            className="pointer-events-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-3 text-xs font-bold text-[var(--ink)] shadow-sm backdrop-blur-xs"
          >
            <Layers size={14} className="text-[var(--accent)]" />
            <span>{basemap === 'vector' ? 'Satellite' : 'Vector'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIs3dTilt((v) => !v)}
            className={`pointer-events-auto inline-flex min-h-[36px] items-center gap-1 rounded-full border px-2.5 text-xs font-bold shadow-sm backdrop-blur-xs ${
              is3dTilt
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                : 'border-[var(--border)] bg-[var(--surface)]/95 text-[var(--ink)]'
            }`}
          >
            <Mountain size={13} />
            <span>{is3dTilt ? '3D' : '2D'}</span>
          </button>
        </div>

        {layer === 'rain' && radarActive && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
            <Radar size={12} />
            Live Rain Radar
          </span>
        )}
      </div>

      {/* Bottom Quick Barangay Strip */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {zones.map((z) => {
            const active = z.barangayId === selectedBarangayId;
            return (
              <button
                key={z.barangayId}
                type="button"
                onClick={() => onSelectZone(z.barangayId)}
                className={`min-h-[34px] shrink-0 rounded-full border px-3 text-xs font-bold transition ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--sub)]'
                }`}
              >
                {z.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
