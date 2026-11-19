import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  CloudRain,
  Compass,
  Droplets,
  Layers,
  Waves,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { OfflineBanner } from '../components/OfflineBanner';
import { StatusPill } from '../components/StatusPill';
import {
  BaybayForecastMap,
  buildBarangayZones,
  type ForecastLayer,
} from '../components/BaybayForecastMap';
import { useAppState } from '../context/AppStateContext';
import { useTheme } from '../context/ThemeContext';

export function MapPage() {
  const { t } = useTranslation();
  const { resolved } = useTheme();
  const { barangays, crops, activeParcel, lastSyncedAt, isOnline } = useAppState();

  const [layer, setLayer] = useState<ForecastLayer>('suitability');
  const [flyTrigger, setFlyTrigger] = useState(0);

  const zones = useMemo(() => buildBarangayZones(barangays), [barangays]);
  const [selectedBarangayId, setSelectedBarangayId] = useState<string>(
    activeParcel.barangay_id || zones[0]?.barangayId || ''
  );

  const selectedZone =
    zones.find((z) => z.barangayId === selectedBarangayId) ?? zones[0];
  const crop = crops.find((c) => c.slug === activeParcel.crop_slug) ?? crops[0];

  const layers: { id: ForecastLayer; label: string; icon: typeof Layers }[] = [
    { id: 'rain', label: t('map.layerRain'), icon: CloudRain },
    { id: 'soil', label: t('map.layerSoil'), icon: Droplets },
    { id: 'flood', label: t('map.layerFlood'), icon: Waves },
    { id: 'suitability', label: t('map.layerSuitability'), icon: Layers },
  ];

  const updatedLabel = new Date(lastSyncedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCenterOnField = () => {
    const match =
      zones.find((z) => z.barangayId === activeParcel.barangay_id) ?? zones[0];
    if (match) {
      setSelectedBarangayId(match.barangayId);
      setFlyTrigger((n) => n + 1);
    }
  };

  const zoneSummary =
    selectedZone.decision === 'go'
      ? t('map.summaryGo')
      : selectedZone.decision === 'avoid'
      ? t('map.summaryAvoid')
      : t('map.summaryWait');

  return (
    <MobileShell>
      {/* Synced 4-Layer Forecast Selector */}
      <header className="pb-3 pt-1">
        <div
          role="tablist"
          aria-label="Map forecast layers"
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
          <h1 className="text-lg font-bold text-[var(--ink)]">
            Baybay City · {crop?.name ?? 'Corn'}
          </h1>
          <p className="text-xs text-[var(--sub)]">{t('map.tapCellHint')}</p>
        </div>
        <button
          type="button"
          onClick={handleCenterOnField}
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--accent)] shadow-xs"
        >
          <Compass size={15} />
          <span>{t('map.myField')}</span>
        </button>
      </div>

      {/* Real Interactive MapLibre GL Map synced to Rain / Soil / Flood / Suitability */}
      <BaybayForecastMap
        zones={zones}
        selectedBarangayId={selectedZone.barangayId}
        onSelectZone={setSelectedBarangayId}
        layer={layer}
        fieldLng={activeParcel.lng || 124.7962}
        fieldLat={activeParcel.lat || 10.7285}
        fieldName={activeParcel.field_name}
        isDark={resolved === 'dark'}
        isOnline={isOnline}
        flyToTrigger={flyTrigger}
      />

      {/* Dynamic Legend for Active Forecast Layer */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-bold">
        {layer === 'rain' && (
          <>
            <span className="text-[var(--sub)]">{t('map.rainLegendTitle')}:</span>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-sky-700 dark:text-sky-300">
                &lt;30 mm
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                40+ mm
              </span>
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-700 dark:text-red-300">
                55+ mm
              </span>
            </div>
          </>
        )}
        {layer === 'soil' && (
          <>
            <span className="text-[var(--sub)]">{t('map.soilLegendTitle')}:</span>
            <div className="flex items-center gap-1.5">
              <span className="status-go rounded-full px-2 py-0.5">Optimal &lt;40%</span>
              <span className="status-info rounded-full px-2 py-0.5">Moist 40–54%</span>
              <span className="status-avoid rounded-full px-2 py-0.5">Wet 55%+</span>
            </div>
          </>
        )}
        {(layer === 'flood' || layer === 'suitability') && (
          <>
            <span className="text-[var(--sub)]">{t('map.suitabilityLegendTitle')}:</span>
            <div className="flex items-center gap-1.5">
              <span className="status-go rounded-full px-2 py-0.5">{t('status.go')}</span>
              <span className="status-wait rounded-full px-2 py-0.5">{t('status.wait')}</span>
              <span className="status-avoid rounded-full px-2 py-0.5">{t('status.avoid')}</span>
            </div>
          </>
        )}
      </div>

      {/* Selected Zone Detail Card */}
      <section className="ag-card mt-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--sub)]">
              {t('map.selectedZone')} · {selectedZone.elevationM} m · {selectedZone.soilTexture}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-[var(--ink)]">
              Brgy. {selectedZone.name}
            </h2>
          </div>
          <StatusPill variant={selectedZone.decision} size="md" />
        </div>

        <p className="mt-2 text-sm leading-relaxed text-[var(--sub)]">{zoneSummary}</p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--bg)] px-2 py-2">
            <p className="text-[11px] font-semibold text-[var(--sub)]">{t('map.layerRain')}</p>
            <p className="text-sm font-bold text-[var(--ink)]">{selectedZone.rainMm} mm</p>
          </div>
          <div className="rounded-xl bg-[var(--bg)] px-2 py-2">
            <p className="text-[11px] font-semibold text-[var(--sub)]">{t('map.layerSoil')}</p>
            <p className="text-sm font-bold text-[var(--ink)]">
              {selectedZone.soilMoisturePct}%
            </p>
          </div>
          <div className="rounded-xl bg-[var(--bg)] px-2 py-2">
            <p className="text-[11px] font-semibold text-[var(--sub)]">{t('map.layerFlood')}</p>
            <p className="text-sm font-bold text-[var(--ink)]">
              {selectedZone.floodRisk === 'high'
                ? t('status.high')
                : selectedZone.floodRisk === 'medium'
                ? t('status.medium')
                : t('status.low')}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--muted)]">
          {crop?.name} ·{' '}
          {selectedZone.confidence === 'high'
            ? t('common.confidenceHigh')
            : selectedZone.confidence === 'low'
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
