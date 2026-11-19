import { WovenThreadLoader } from './WovenThreadLoader';

function ShimmerBar({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`ag-shimmer rounded-xl bg-[var(--surface-muted)] ${className}`}
    />
  );
}

/**
 * Low-data shimmer skeleton matching HomePage card geometry so layout never jumps on 3G/4G.
 */
export function HomeSkeleton() {
  return (
    <div className="space-y-3.5" aria-busy="true" aria-label="Loading farm forecast">
      <div className="ag-card space-y-2.5 p-4">
        <ShimmerBar className="h-3 w-24" />
        <ShimmerBar className="h-6 w-44" />
        <ShimmerBar className="h-4 w-52" />
      </div>

      <div className="ag-card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <ShimmerBar className="h-3 w-28" />
          <ShimmerBar className="h-5 w-32 rounded-full" />
        </div>
        <ShimmerBar className="h-9 w-48" />
        <div className="flex gap-2">
          <ShimmerBar className="h-7 w-20 rounded-full" />
          <ShimmerBar className="h-7 w-40 rounded-full" />
        </div>
        <ShimmerBar className="h-5 w-56" />
        <ShimmerBar className="h-4 w-full" />
        <ShimmerBar className="h-12 w-full rounded-2xl" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="ag-card space-y-3 p-4">
          <ShimmerBar className="h-10 w-10 rounded-full" />
          <ShimmerBar className="h-3.5 w-20" />
          <ShimmerBar className="h-6 w-24" />
        </div>
        <div className="ag-card space-y-3 p-4">
          <ShimmerBar className="h-10 w-full" />
          <ShimmerBar className="h-3.5 w-20" />
          <ShimmerBar className="h-6 w-20" />
        </div>
      </div>

      <div className="flex justify-center pt-1">
        <WovenThreadLoader size="sm" label="Syncing satellite & weather cache..." />
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton matching CropSuggestionsPage rows.
 */
export function CropListSkeleton() {
  return (
    <div className="ag-card divide-y divide-[var(--border)] overflow-hidden" aria-busy="true">
      {[0, 1, 2].map((idx) => (
        <div key={idx} className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <ShimmerBar className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <ShimmerBar className="h-4 w-32" />
              <ShimmerBar className="h-3 w-44" />
            </div>
          </div>
          <ShimmerBar className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton matching MapPage MapLibre panel + selected zone sheet.
 */
export function MapPanelSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading forecast map">
      <div className="ag-card relative flex h-[340px] flex-col items-center justify-center overflow-hidden p-4">
        <WovenThreadLoader size="md" label="Loading Baybay City forecast map..." />
      </div>
      <div className="ag-card space-y-3 p-4">
        <ShimmerBar className="h-3.5 w-36" />
        <ShimmerBar className="h-6 w-40" />
        <ShimmerBar className="h-4 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <ShimmerBar className="h-12 w-full" />
          <ShimmerBar className="h-12 w-full" />
          <ShimmerBar className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton matching AlertsPage list.
 */
export function AlertsListSkeleton() {
  return (
    <div className="ag-card divide-y divide-[var(--border)] overflow-hidden" aria-busy="true">
      {[0, 1, 2, 3].map((idx) => (
        <div key={idx} className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <ShimmerBar className="h-11 w-11 rounded-full" />
            <div className="space-y-2">
              <ShimmerBar className="h-4 w-40" />
              <ShimmerBar className="h-3 w-32" />
            </div>
          </div>
          <ShimmerBar className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
