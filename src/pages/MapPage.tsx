import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  CloudRain,
  Compass,
  Droplets,
  Layers,
  MapPin,
  Waves,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { OfflineBanner } from '../components/OfflineBanner';
import { StatusPill } from '../components/StatusPill';
import { useAppState } from '../context/AppStateContext';
import { MAP_GRID_CELLS } from '../data/seedData';
import type { MapGridCell } from '../types/database';

type MapLayer = 'suitability' | 'rain' | 'soil' | 'flood';

export function MapPage() {
  const { t } = useTranslation();
  const { crops, activeParcel, lastSyncedAt } = useAppState();

  const [layer, setLayer] = useState<MapLayer>('suitability');
  const [selectedId, setSelectedId] = useState<string>(activeParcel.grid_cell || 'B2');

  const crop = crops.find((c) => c.slug === activeParcel.crop_slug) ?? crops[0];
  const selectedCell: MapGridCell =
    MAP_GRID_CELLS.find((c) => c.id === selectedId) ?? MAP_GRID_CELLS[4];

  const layers: { id: MapLayer; label: string; icon: typeof Layers }[] = [
    { id: 'rain', label: t('map.layerRain'), icon: CloudRain },
    { id: 'soil', label: t('map.layerSoil'), icon: Droplets },
    { id: 'flood', label: t('map.layerFlood'), icon: Waves },
    { id: 'suitability', label: t('map.layerSuitability'), icon: Layers },
  ];

  const getCellStyle = (cell: MapGridCell) => {
    if (layer === 'rain') {
      if (cell.rain_mm >= 50) return 'status-avoid';
      if (cell.rain_mm >= 35) return 'status-wait';
      return 'status-go';
    }
    if (layer === 'soil') {
      if (cell.soil_moisture_pct >= 55) return 'status-avoid';
      if (cell.soil_moisture_pct >= 38) return 'status-wait';
      return 'status-go';
    }
    if (layer === 'flood') {
      if (cell.flood_risk === 'high') return 'status-avoid';
      if (cell.flood_risk === 'medium') return 'status-wait';
      return 'status-go';
    }
    if (cell.decision === 'avoid') return 'status-avoid';
    if (cell.decision === 'wait') return 'status-wait';
    return 'status-go';
  };

  const getCellReading = (cell: MapGridCell) => {
    if (layer === 'rain') return `${cell.rain_mm} mm`;
    if (layer === 'soil') return `${cell.soil_moisture_pct}% wet`;
    if (layer === 'flood') return cell.flood_risk.toUpperCase();
    return cell.decision.toUpperCase();
  };

  const updatedLabel = new Date(lastSyncedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <MobileShell>
      {/* Layer Switcher Pill Bar (Figma 03 Map top bar) */}
      <header className="pb-3 pt-1">
        <div
          role="tablist"
          aria-label="Map data layers"
          className="grid grid-cols-4 gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-xs"
        >
          {layers.map((item) => {
            const Icon = item.icon;
            const active = item.id === layer;
            return (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setLayer(item.id)}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-bold transition ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                    : 'text-[var(--sub)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <OfflineBanner />

      {/* Map Header Bar */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-[var(--ink)]">Baybay City · {crop.name}</h1>
          <p className="text-xs text-[var(--sub)]">{t('map.tapCellHint')}</p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedId(activeParcel.grid_cell || 'B2')}
          aria-label="Center on my field"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--accent)] shadow-xs"
        >
          <Compass size={15} />
          <span>My field</span>
        </button>
      </div>

      {/* Stylized Baybay City Grid Map Canvas (Non-overlapping, high-contrast) */}
      <section className="ag-card relative overflow-hidden p-3.5">
        {/* Subtle coastal & elevation geography hints */}
        <div className="mb-2.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--sub)]">
          <span>← Camotes Sea (West)</span>
          <span>Mt. Pangasugan (East) →</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {MAP_GRID_CELLS.map((cell) => {
            const isSelected = cell.id === selectedCell.id;
            const isMyField = cell.id === activeParcel.grid_cell;

            return (
              <button
                key={cell.id}
                type="button"
                onClick={() => setSelectedId(cell.id)}
                className={`relative flex min-h-[78px] flex-col items-start justify-between rounded-2xl p-2.5 text-left transition ${getCellStyle(
                  cell
                )} ${
                  isSelected
                    ? 'scale-[1.02] ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface)]'
                    : 'opacity-92 hover:opacity-100'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-xs font-extrabold">{cell.id}</span>
                  {isMyField && (
                    <span
                      title={activeParcel.field_name}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--bg)]"
                    >
                      <MapPin size={11} />
                    </span>
                  )}
                </div>

                <div className="mt-1">
                  <div className="text-[13px] font-extrabold leading-tight">
                    {getCellReading(cell)}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] font-semibold opacity-85">
                    {cell.barangay_name.replace('Brgy. ', '')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Field Indicator + Clean Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-bold text-[var(--ink)]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--bg)]">
              <MapPin size={11} />
            </span>
            {activeParcel.field_name} (Zone {activeParcel.grid_cell})
          </span>
          <div className="flex items-center gap-1.5">
            <span className="status-go rounded-full px-2 py-0.5 font-bold">GO</span>
            <span className="status-wait rounded-full px-2 py-0.5 font-bold">WAIT</span>
            <span className="status-avoid rounded-full px-2 py-0.5 font-bold">AVOID</span>
          </div>
        </div>
      </section>

      {/* Selected Zone Detail Sheet Card */}
      <section className="ag-card mt-3.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--sub)]">
              {t('map.selectedZone')} · {selectedCell.id}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-[var(--ink)]">
              {selectedCell.barangay_name}
            </h2>
          </div>
          <StatusPill variant={selectedCell.decision} size="md" />
        </div>

        <p className="mt-2 text-sm leading-relaxed text-[var(--sub)]">{selectedCell.summary}</p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--bg)] px-2 py-2">
            <p className="text-[11px] font-semibold text-[var(--sub)]">{t('map.layerRain')}</p>
            <p className="text-sm font-bold text-[var(--ink)]">{selectedCell.rain_mm} mm</p>
          </div>
          <div className="rounded-xl bg-[var(--bg)] px-2 py-2">
            <p className="text-[11px] font-semibold text-[var(--sub)]">{t('map.layerSoil')}</p>
            <p className="text-sm font-bold text-[var(--ink)]">
              {selectedCell.soil_moisture_pct}%
            </p>
          </div>
          <div className="rounded-xl bg-[var(--bg)] px-2 py-2">
            <p className="text-[11px] font-semibold text-[var(--sub)]">{t('map.layerFlood')}</p>
            <p className="text-sm font-bold capitalize text-[var(--ink)]">
              {selectedCell.flood_risk}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--muted)]">
          {crop.name} ·{' '}
          {selectedCell.confidence === 'high'
            ? t('common.confidenceHigh')
            : selectedCell.confidence === 'low'
            ? t('common.confidenceLow')
            : t('common.confidenceMedium')}{' '}
          · {t('common.updated')} {updatedLabel}
        </p>

        <Link
          to="/planting-window"
          className="mt-3 flex min-h-[48px] items-center justify-between rounded-2xl bg-[var(--accent-soft)] px-4 text-sm font-bold text-[var(--accent)]"
        >
          <span>{t('map.openWhy')}</span>
          <ChevronRight size={18} />
        </Link>
      </section>
    </MobileShell>
  );
}
