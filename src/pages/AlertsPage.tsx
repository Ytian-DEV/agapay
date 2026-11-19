import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  CloudRain,
  Droplets,
  Flag,
  MessageSquareText,
  Sun,
  X,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { OfflineBanner } from '../components/OfflineBanner';
import { StatusPill } from '../components/StatusPill';
import { useAppState } from '../context/AppStateContext';
import { BARANGAYS, INITIAL_ALERTS } from '../data/seedData';
import type { RiskAlert } from '../types/database';

export function AlertsPage() {
  const { t } = useTranslation();
  const { activeParcel, profile, updateProfile, submitDispute } = useAppState();

  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [disputedIds, setDisputedIds] = useState<string[]>([]);

  const barangay =
    BARANGAYS.find((b) => b.id === activeParcel.barangay_id) ?? BARANGAYS[0];

  const list = INITIAL_ALERTS.filter((a) =>
    tab === 'current' ? a.is_active : !a.is_active
  );

  const getCategoryIcon = (cat: RiskAlert['category']) => {
    switch (cat) {
      case 'heavy_rain':
        return CloudRain;
      case 'waterlogging':
        return Droplets;
      case 'dry_spell':
        return Sun;
      case 'planting_window':
      default:
        return CheckCircle2;
    }
  };

  const getIconTone = (sev: RiskAlert['severity']) => {
    switch (sev) {
      case 'high':
        return 'bg-[var(--avoid-bg)] text-[var(--avoid-text)]';
      case 'medium':
        return 'bg-[var(--wait-bg)] text-[var(--wait-text)]';
      case 'low':
        return 'bg-[var(--go-bg)] text-[var(--go-text)]';
      case 'info':
      default:
        return 'bg-[var(--info-bg)] text-[var(--info-text)]';
    }
  };

  const handleFlagAlert = async (alert: RiskAlert) => {
    await submitDispute({
      barangay_id: barangay.id,
      reason: 'rain_mismatch',
      farmer_note: `Flagged alert: ${alert.title}`,
    });
    setDisputedIds((prev) => [...prev, alert.id]);
  };

  return (
    <MobileShell>
      <header className="pb-3 pt-1">
        <p className="text-xs font-semibold text-[var(--sub)]">
          Brgy. {barangay.name} · {barangay.municipality}
        </p>
        <h1 className="mt-0.5 text-[34px] font-bold leading-tight tracking-tight text-[var(--ink)]">
          {t('alerts.title')}
        </h1>
      </header>

      <OfflineBanner />

      {/* Current / History Segmented Switch */}
      <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
        {(['current', 'history'] as const).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`min-h-[44px] rounded-full text-sm font-bold transition ${
                active
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                  : 'text-[var(--sub)] hover:text-[var(--ink)]'
              }`}
            >
              {key === 'current' ? t('alerts.current') : t('alerts.history')}
            </button>
          );
        })}
      </div>

      {/* Alerts List */}
      <section className="ag-card divide-y divide-[var(--border)] overflow-hidden">
        {list.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--sub)]">
            {t('alerts.noAlerts')}
          </div>
        ) : (
          list.map((alert) => {
            const Icon = getCategoryIcon(alert.category);
            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => setSelectedAlert(alert)}
                className="flex min-h-[76px] w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-muted)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${getIconTone(
                      alert.severity
                    )}`}
                  >
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold leading-snug text-[var(--ink)]">
                      {alert.title}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[var(--sub)]">
                      {alert.action_summary}
                    </p>
                  </div>
                </div>
                <StatusPill variant={alert.severity} />
              </button>
            );
          })
        )}
      </section>

      {/* SMS Backup Delivery Toggle (Figma 04 Alerts bottom section) */}
      <section className="ag-card mt-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <MessageSquareText size={19} />
            </span>
            <div>
              <p className="text-[15px] font-bold text-[var(--ink)]">
                {t('alerts.alsoSendSms')}
              </p>
              <p className="text-xs text-[var(--sub)]">{profile.phone_number}</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={profile.sms_alerts_enabled}
            onClick={() =>
              updateProfile({ sms_alerts_enabled: !profile.sms_alerts_enabled })
            }
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
              profile.sms_alerts_enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                profile.sms_alerts_enabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        <p className="mt-2.5 text-xs text-[var(--sub)]">{t('alerts.smsActiveNote')}</p>

        <Link
          to="/sms-preview"
          className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs font-bold text-[var(--accent)] transition hover:border-[var(--accent)]"
        >
          Preview SMS alerts & commands
        </Link>
      </section>

      {/* Alert Detail Bottom Sheet Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="w-full max-w-md rounded-t-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:rounded-[28px]"
            style={{ paddingBottom: 'max(20px, var(--safe-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <StatusPill variant={selectedAlert.severity} size="md" />
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                aria-label={t('common.close')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--ink)]"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-3 text-xl font-bold text-[var(--ink)]">
              {selectedAlert.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[var(--accent)]">
              Action: {selectedAlert.action_summary}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--sub)]">
              {selectedAlert.detail_explanation}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--bg)] px-3.5 py-2.5 text-xs text-[var(--sub)]">
              <span>Brgy. {barangay.name}</span>
              <span>
                {selectedAlert.sms_dispatched ? 'Sent via SMS & App' : 'App alert only'}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {disputedIds.includes(selectedAlert.id) ? (
                <div className="status-go flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold">
                  <CheckCircle2 size={16} />
                  <span>{t('alerts.disputeSent')}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFlagAlert(selectedAlert)}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] text-sm font-bold text-[var(--sub)] hover:text-[var(--ink)]"
                >
                  <Flag size={15} />
                  <span>{t('alerts.disputeAdvisory')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
