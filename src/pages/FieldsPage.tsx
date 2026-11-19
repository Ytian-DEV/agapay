import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Database,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { useAppState } from '../context/AppStateContext';
import { isUuid } from '../lib/supabase';
import type { Crop } from '../types/database';

export function FieldsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    barangays,
    crops,
    parcels,
    activeParcel,
    setActiveParcelId,
    addParcel,
    deleteParcel,
    rainCheckins,
    harvestReports,
  } = useAppState();

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [barangayId, setBarangayId] = useState(
    barangays.find((b) => b.name === 'Gabas')?.id ?? barangays[0]?.id ?? ''
  );
  const [cropSlug, setCropSlug] = useState<Crop['slug']>('sweet-potato');
  const [areaHa, setAreaHa] = useState('1.0');

  const parsedArea = Math.max(0.1, Number.parseFloat(areaHa) || 1.0);
  const isOutlier = parsedArea > 25;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const b = barangays.find((x) => x.id === barangayId) ?? barangays[0];
    await addParcel({
      field_name: fieldName.trim() || `${b.name} Plot`,
      barangay_id: b.id,
      crop_slug: cropSlug,
      area_ha: parsedArea,
      is_outlier_flagged: isOutlier,
      technician_verified: false,
      grid_cell: 'A2',
      lat: b.center_lat,
      lng: b.center_lng,
      drainage_note: `${b.soil_texture} · ${b.drainage_class.replace('_', ' ')}`,
    });
    setSaving(false);
    setFieldName('');
    setAdding(false);
  };

  return (
    <MobileShell showTabs={false}>
      <header className="flex items-center justify-between pb-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-semibold text-[var(--sub)]">Baybay City, Leyte</p>
            <h1 className="text-2xl font-bold text-[var(--ink)]">{t('profile.manageFields')}</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 text-xs font-bold text-[var(--on-accent)]"
        >
          <Plus size={16} />
          <span>Add field</span>
        </button>
      </header>

      <div className="space-y-3.5 pb-8">
        {adding && (
          <form onSubmit={handleAdd} className="ag-card space-y-3 p-4">
            <h2 className="text-base font-bold text-[var(--ink)]">Register a new field</h2>
            <input
              type="text"
              required
              placeholder="Field name (e.g., East Hillside)"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 text-sm font-semibold text-[var(--ink)]"
            />

            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={barangayId}
                onChange={(e) => setBarangayId(e.target.value)}
                className="min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm font-semibold text-[var(--ink)]"
              >
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    Brgy. {b.name}
                  </option>
                ))}
              </select>

              <select
                value={cropSlug}
                onChange={(e) => setCropSlug(e.target.value as Crop['slug'])}
                className="min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm font-semibold text-[var(--ink)]"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="number"
              step="0.1"
              min="0.1"
              max="500"
              value={areaHa}
              onChange={(e) => setAreaHa(e.target.value)}
              placeholder="Area in hectares"
              className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 text-sm font-bold text-[var(--ink)]"
            />

            {isOutlier && (
              <div className="status-wait flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
                <AlertTriangle size={15} />
                <span>{t('onboarding.outlierWarning')}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="min-h-[48px] flex-1 rounded-full border border-[var(--border)] text-sm font-bold text-[var(--sub)]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--on-accent)] disabled:opacity-60"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                <span>{saving ? 'Saving...' : t('common.save')}</span>
              </button>
            </div>
          </form>
        )}

        {parcels.map((parcel) => {
          const isActive = parcel.id === activeParcel.id;
          const b = barangays.find((x) => x.id === parcel.barangay_id) ?? barangays[0];
          const c = crops.find((x) => x.slug === parcel.crop_slug) ?? crops[0];
          const fieldRains = rainCheckins.filter((r) => r.parcel_id === parcel.id).length;
          const fieldHarvests = harvestReports.filter((h) => h.parcel_id === parcel.id).length;
          const isCloudSaved = isUuid(parcel.id);

          return (
            <section
              key={parcel.id}
              className={`ag-card p-4 transition ${
                isActive ? 'border-2 border-[var(--accent)]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--ink)]">{parcel.field_name}</h2>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent)]">
                        <Check size={12} strokeWidth={3} /> Active
                      </span>
                    )}
                    {isCloudSaved && (
                      <span className="status-go inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                        <Database size={10} /> Supabase
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[var(--sub)]">
                    <MapPin size={13} />
                    Brgy. {b?.name ?? 'Gabas'} · Zone {parcel.grid_cell} · {parcel.area_ha}{' '}
                    {t('common.hectares')}
                  </p>
                </div>

                {parcels.length > 1 && (
                  <button
                    type="button"
                    aria-label="Delete field"
                    onClick={() => void deleteParcel(parcel.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--sub)] hover:bg-[var(--avoid-bg)] hover:text-[var(--avoid-text)]"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[var(--bg)] p-2.5 text-center text-xs">
                <div>
                  <p className="text-[var(--sub)]">Crop</p>
                  <p className="font-bold text-[var(--ink)]">{c?.name ?? 'Corn'}</p>
                </div>
                <div>
                  <p className="text-[var(--sub)]">Parcel ID</p>
                  <p className="font-mono font-bold text-[var(--ink)]">
                    {parcel.parcel_code.slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--sub)]">Logs</p>
                  <p className="font-bold text-[var(--ink)]">
                    {fieldRains} rain · {fieldHarvests} ani
                  </p>
                </div>
              </div>

              <p className="mt-2.5 text-xs text-[var(--sub)]">{parcel.drainage_note}</p>

              {!isActive && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveParcelId(parcel.id);
                    navigate('/home');
                  }}
                  className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]"
                >
                  Select as active field
                </button>
              )}
            </section>
          );
        })}
      </div>
    </MobileShell>
  );
}
