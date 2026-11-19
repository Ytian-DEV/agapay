import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Radar } from 'lucide-react';
import type { Barangay, DecisionStatus } from '../types/database';

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

/**
 * Generates clean hexagonal/parcel-shaped GeoJSON polygons centered on each Baybay City barangay
 * so MapLibre renders crisp clickable forecast zones synced to real geography.
 */
function buildZonesGeoJson(
  zones: BarangayZoneFeatureData[],
  layer: ForecastLayer
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const radiusLng = 0.0085;
  const radiusLat = 0.0068;

  const colorForZone = (z: BarangayZoneFeatureData): string => {
    if (layer === 'rain') {
      if (z.rainMm >= 55) return '#dc2626';
      if (z.rainMm >= 40) return '#d97706';
      if (z.rainMm >= 30) return '#2563eb';
      return '#0ea5e9';
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
  };

  const badgeText = (z: BarangayZoneFeatureData): string => {
    if (layer === 'rain') return `${z.name}\n${z.rainMm} mm`;
    if (layer === 'soil') return `${z.name}\n${z.soilMoisturePct}%`;
    if (layer === 'flood') return `${z.name}\n${z.floodRisk.toUpperCase()}`;
    return `${z.name}\n${z.decision.toUpperCase()}`;
  };

  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = zones.map((z) => {
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
      id: z.barangayId,
      properties: {
        barangayId: z.barangayId,
        name: z.name,
        fillColor: colorForZone(z),
        label: badgeText(z),
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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const fieldMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [basemap, setBasemap] = useState<'streets' | 'satellite'>('streets');
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
        // Offline or network restricted — GeoJSON rainfall overlay still renders cleanly
      });
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  // Build MapLibre style spec (reacts to Light/Dark & Street/Satellite toggle)
  const buildBaseTileUrl = () => {
    if (basemap === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    return isDark
      ? 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
      : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';
  };

  // Initialize MapLibre instance
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [fieldLng || 124.8005, fieldLat || 10.7145],
      zoom: 12.1,
      minZoom: 10,
      maxZoom: 16.5,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [buildBaseTileUrl()],
            tileSize: 256,
            attribution: '© OpenStreetMap · CARTO · Esri',
          },
          zones: {
            type: 'geojson',
            data: geojson,
          },
        },
        layers: [
          {
            id: 'basemap-layer',
            type: 'raster',
            source: 'basemap',
          },
          {
            id: 'zones-fill',
            type: 'fill',
            source: 'zones',
            paint: {
              'fill-color': ['get', 'fillColor'],
              'fill-opacity': 0.36,
            },
          },
          {
            id: 'zones-outline',
            type: 'line',
            source: 'zones',
            paint: {
              'line-color': ['get', 'fillColor'],
              'line-width': [
                'case',
                ['==', ['get', 'barangayId'], selectedBarangayId],
                3.5,
                1.5,
              ],
            },
          },
        ],
      },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('click', 'zones-fill', (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const brgyId = feature?.properties?.barangayId as string | undefined;
      if (brgyId) {
        onSelectZone(brgyId);
      }
    });

    map.on('mouseenter', 'zones-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'zones-fill', () => {
      map.getCanvas().style.cursor = '';
    });

    mapRef.current = map;

    return () => {
      fieldMarkerRef.current?.remove();
      fieldMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // Re-init only when basemap or light/dark theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basemap, isDark]);

  // Sync GeoJSON data & selected outline whenever layer/zones/selection change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyUpdates = () => {
      const src = map.getSource('zones') as maplibregl.GeoJSONSource | undefined;
      if (src) {
        src.setData(geojson);
      }
      if (map.getLayer('zones-outline')) {
        map.setPaintProperty('zones-outline', 'line-width', [
          'case',
          ['==', ['get', 'barangayId'], selectedBarangayId],
          3.8,
          1.5,
        ]);
      }

      // Sync live RainViewer precipitation radar layer when Rain tab is active!
      const hasRadarLayer = Boolean(map.getLayer('rain-radar-layer'));
      if (layer === 'rain' && radarTileUrl) {
        if (!map.getSource('rain-radar')) {
          map.addSource('rain-radar', {
            type: 'raster',
            tiles: [radarTileUrl],
            tileSize: 256,
          });
        }
        if (!hasRadarLayer) {
          map.addLayer(
            {
              id: 'rain-radar-layer',
              type: 'raster',
              source: 'rain-radar',
              paint: { 'raster-opacity': 0.58 },
            },
            'zones-fill'
          );
        } else {
          map.setLayoutProperty('rain-radar-layer', 'visibility', 'visible');
        }
        setRadarActive(true);
      } else {
        if (hasRadarLayer) {
          map.setLayoutProperty('rain-radar-layer', 'visibility', 'none');
        }
        setRadarActive(false);
      }
    };

    if (map.isStyleLoaded()) {
      applyUpdates();
    } else {
      map.once('load', applyUpdates);
    }
  }, [geojson, selectedBarangayId, layer, radarTileUrl]);

  // Sync farmer's field marker pin + barangay quick labels
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    fieldMarkerRef.current?.remove();
    const el = document.createElement('div');
    el.className = 'agapay-field-pin';
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:5px;background:#111312;color:#ffffff;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.35);border:2px solid #4fb67f;white-space:nowrap;">
        <span style="width:8px;height:8px;border-radius:999px;background:#4fb67f;display:inline-block;"></span>
        <span>${fieldName}</span>
      </div>
    `;

    fieldMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([fieldLng, fieldLat])
      .addTo(map);
  }, [fieldLng, fieldLat, fieldName, basemap, isDark]);

  // Fly smoothly to selected zone or user's field
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const z = zones.find((x) => x.barangayId === selectedBarangayId);
    if (z) {
      map.flyTo({
        center: [z.centerLng, z.centerLat],
        zoom: 12.6,
        duration: 650,
      });
    }
  }, [selectedBarangayId, flyToTrigger, zones]);

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div ref={containerRef} className="h-[340px] w-full sm:h-[380px]" />

      {/* Top-Left Live Sync Badge + Basemap Toggle */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setBasemap((b) => (b === 'streets' ? 'satellite' : 'streets'))}
          className="pointer-events-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-3 text-xs font-bold text-[var(--ink)] shadow-sm backdrop-blur-xs"
        >
          <Layers size={14} className="text-[var(--accent)]" />
          <span>{basemap === 'streets' ? 'Satellite view' : 'Map view'}</span>
        </button>

        {layer === 'rain' && radarActive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
            <Radar size={12} />
            Live Rain Radar
          </span>
        )}
      </div>

      {/* Bottom-Left Quick Barangay Chips on Map */}
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
