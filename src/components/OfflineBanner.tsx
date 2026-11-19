import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CloudOff, RefreshCw } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline, isCacheStale, pendingSyncCount, lastSyncedAt } = useAppState();

  if (isOnline && !isCacheStale && pendingSyncCount === 0) return null;

  const formattedTime = new Date(lastSyncedAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mb-3 space-y-2">
      {!isOnline && (
        <Link
          to="/sync"
          className="status-wait flex items-start gap-3 rounded-2xl px-4 py-3 text-xs leading-snug transition hover:opacity-95"
        >
          <CloudOff size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">{t('home.offlineBanner')}</p>
            <p className="mt-0.5 opacity-90">
              {t('common.updated')}: {formattedTime}
              {pendingSyncCount > 0 ? ` · ${pendingSyncCount} queued` : ''}
            </p>
          </div>
        </Link>
      )}

      {isCacheStale && (
        <div className="status-avoid flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-bold">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{t('common.staleWarning')}</span>
        </div>
      )}

      {isOnline && pendingSyncCount > 0 && (
        <Link
          to="/sync"
          className="status-info flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold"
        >
          <span className="flex items-center gap-2">
            <RefreshCw size={14} />
            {pendingSyncCount} report(s) waiting to sync
          </span>
          <span className="underline">Sync</span>
        </Link>
      )}
    </div>
  );
}
