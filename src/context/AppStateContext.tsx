import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  BillingCycle,
  Crop,
  FarmParcel,
  HarvestReport,
  Profile,
  RainCheckIn,
  RainIntensity,
  RecommendationDispute,
  SubscriptionTier,
  UserConsent,
} from '../types/database';
import { INITIAL_PARCELS } from '../data/seedData';
import {
  pushAdvisoryDispute,
  pushHarvestReport,
  pushRainCheckIn,
  upsertFarmParcel,
} from '../lib/supabase';

const STATE_KEY = 'agapay_app_state_v1';

interface PersistedState {
  hasCompletedOnboarding: boolean;
  profile: Profile;
  consent: UserConsent;
  parcels: FarmParcel[];
  activeParcelId: string;
  rainCheckins: RainCheckIn[];
  harvestReports: HarvestReport[];
  disputes: RecommendationDispute[];
  lastSyncedAt: string;
  simulateOffline: boolean;
  simulateStaleCache: boolean;
}

const DEFAULT_STATE: PersistedState = {
  hasCompletedOnboarding: false,
  profile: {
    id: 'farmer-local-01',
    full_name: 'Mang Sauro',
    phone_number: '0917 482 1930',
    role: 'farmer',
    preferred_language: 'en',
    subscription_tier: 'pro', // Pro default so users can test full suite; easily switchable to Free/Business
    billing_cycle: 'yearly',
    sms_alerts_enabled: true,
    barangay_id: 'brgy-gabas',
  },
  consent: {
    location_consent: true,
    farm_data_consent: true,
    reminders_consent: true,
    privacy_policy_accepted: true,
    consent_version: '2026.1-RA10173',
    agreed_at: new Date().toISOString(),
    withdrawn_at: null,
  },
  parcels: INITIAL_PARCELS,
  activeParcelId: INITIAL_PARCELS[0].id,
  rainCheckins: [
    {
      id: 'rc-seed-1',
      parcel_id: INITIAL_PARCELS[0].id,
      barangay_id: 'brgy-gabas',
      intensity: 'light',
      observed_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      source: 'app',
      synced: true,
    },
  ],
  harvestReports: [
    {
      id: 'hr-seed-1',
      parcel_id: INITIAL_PARCELS[0].id,
      barangay_id: 'brgy-gabas',
      crop_slug: 'corn',
      variety: 'IPB Var 6 (White)',
      yield_sacks_per_ha: 54,
      harvest_date: '2026-08-18',
      synced: true,
      created_at: '2026-08-19T07:15:00+08:00',
    },
  ],
  disputes: [],
  lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  simulateOffline: false,
  simulateStaleCache: false,
};

interface AppStateContextValue extends PersistedState {
  isOnline: boolean;
  isCacheStale: boolean;
  pendingSyncCount: number;
  activeParcel: FarmParcel;
  setActiveParcelId: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateConsent: (patch: Partial<UserConsent>) => void;
  withdrawConsent: () => void;
  completeOnboarding: (parcel?: Omit<FarmParcel, 'id' | 'parcel_code' | 'created_at'>) => void;
  addParcel: (parcel: Omit<FarmParcel, 'id' | 'parcel_code' | 'created_at'>) => FarmParcel;
  deleteParcel: (id: string) => void;
  submitRainCheckIn: (intensity: RainIntensity, parcelId?: string) => Promise<RainCheckIn>;
  submitHarvestReport: (input: {
    parcel_id: string;
    crop_slug: Crop['slug'];
    variety: string;
    yield_sacks_per_ha: number;
    harvest_date: string;
  }) => Promise<HarvestReport>;
  submitDispute: (input: {
    advisory_id?: string;
    barangay_id: string;
    reason: RecommendationDispute['reason'];
    farmer_note: string;
  }) => Promise<RecommendationDispute>;
  setPlan: (tier: SubscriptionTier, cycle?: BillingCycle) => void;
  setSimulateOffline: (val: boolean) => void;
  setSimulateStaleCache: (val: boolean) => void;
  syncPendingNow: () => Promise<void>;
  resetSession: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        ...DEFAULT_STATE,
        ...parsed,
        profile: { ...DEFAULT_STATE.profile, ...(parsed.profile ?? {}) },
        consent: { ...DEFAULT_STATE.consent, ...(parsed.consent ?? {}) },
        parcels: parsed.parcels && parsed.parcels.length > 0 ? parsed.parcels : DEFAULT_STATE.parcels,
      };
    }
  } catch {
    // ignore corrupted local storage
  }
  return DEFAULT_STATE;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadPersisted);
  const [browserOnline, setBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota
    }
  }, [state]);

  const isOnline = browserOnline && !state.simulateOffline;

  // Workbook p.10 rule: mark cached data as "may be outdated" if older than 3 days (72h)
  const isCacheStale = useMemo(() => {
    if (state.simulateStaleCache) return true;
    const ageMs = Date.now() - new Date(state.lastSyncedAt).getTime();
    return ageMs > 72 * 60 * 60 * 1000;
  }, [state.lastSyncedAt, state.simulateStaleCache]);

  const activeParcel = useMemo(() => {
    return (
      state.parcels.find((p) => p.id === state.activeParcelId) ?? state.parcels[0]
    );
  }, [state.parcels, state.activeParcelId]);

  const pendingSyncCount = useMemo(() => {
    return (
      state.rainCheckins.filter((r) => !r.synced).length +
      state.harvestReports.filter((h) => !h.synced).length +
      state.disputes.filter((d) => !d.synced).length
    );
  }, [state.rainCheckins, state.harvestReports, state.disputes]);

  const setActiveParcelId = (id: string) =>
    setState((s) => ({ ...s, activeParcelId: id }));

  const updateProfile = (patch: Partial<Profile>) =>
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));

  const updateConsent = (patch: Partial<UserConsent>) =>
    setState((s) => ({
      ...s,
      consent: {
        ...s.consent,
        ...patch,
        withdrawn_at: null,
      },
    }));

  const withdrawConsent = () =>
    setState((s) => ({
      ...s,
      consent: {
        ...s.consent,
        location_consent: false,
        farm_data_consent: false,
        reminders_consent: false,
        privacy_policy_accepted: false,
        withdrawn_at: new Date().toISOString(),
      },
    }));

  const addParcel = (input: Omit<FarmParcel, 'id' | 'parcel_code' | 'created_at'>): FarmParcel => {
    const newParcel: FarmParcel = {
      ...input,
      id: `parcel-${Date.now()}`,
      parcel_code: `AGP-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
      is_outlier_flagged: input.area_ha > 25,
      created_at: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      parcels: [newParcel, ...s.parcels],
      activeParcelId: newParcel.id,
    }));
    void upsertFarmParcel(newParcel, state.profile.id);
    return newParcel;
  };

  const deleteParcel = (id: string) => {
    setState((s) => {
      const remaining = s.parcels.filter((p) => p.id !== id);
      const safeParcels = remaining.length > 0 ? remaining : INITIAL_PARCELS;
      return {
        ...s,
        parcels: safeParcels,
        activeParcelId:
          s.activeParcelId === id ? safeParcels[0].id : s.activeParcelId,
      };
    });
  };

  const completeOnboarding = (
    parcel?: Omit<FarmParcel, 'id' | 'parcel_code' | 'created_at'>
  ) => {
    if (parcel) {
      addParcel(parcel);
    }
    setState((s) => ({
      ...s,
      hasCompletedOnboarding: true,
      lastSyncedAt: new Date().toISOString(),
    }));
  };

  const submitRainCheckIn = async (
    intensity: RainIntensity,
    parcelId?: string
  ): Promise<RainCheckIn> => {
    const targetParcel =
      state.parcels.find((p) => p.id === parcelId) ?? activeParcel;
    const entry: RainCheckIn = {
      id: `rc-${Date.now()}`,
      parcel_id: targetParcel.id,
      barangay_id: targetParcel.barangay_id,
      intensity,
      observed_at: new Date().toISOString(),
      source: 'app',
      synced: isOnline,
    };

    if (isOnline) {
      await pushRainCheckIn(entry, state.profile.id);
    }

    setState((s) => ({
      ...s,
      rainCheckins: [entry, ...s.rainCheckins],
      lastSyncedAt: isOnline ? new Date().toISOString() : s.lastSyncedAt,
    }));
    return entry;
  };

  const submitHarvestReport: AppStateContextValue['submitHarvestReport'] = async (
    input
  ) => {
    const targetParcel =
      state.parcels.find((p) => p.id === input.parcel_id) ?? activeParcel;
    const report: HarvestReport = {
      id: `hr-${Date.now()}`,
      parcel_id: targetParcel.id,
      barangay_id: targetParcel.barangay_id,
      crop_slug: input.crop_slug,
      variety: input.variety,
      yield_sacks_per_ha: input.yield_sacks_per_ha,
      harvest_date: input.harvest_date,
      synced: isOnline,
      created_at: new Date().toISOString(),
    };

    if (isOnline) {
      await pushHarvestReport(report, state.profile.id);
    }

    setState((s) => ({
      ...s,
      harvestReports: [report, ...s.harvestReports],
      lastSyncedAt: isOnline ? new Date().toISOString() : s.lastSyncedAt,
    }));
    return report;
  };

  const submitDispute: AppStateContextValue['submitDispute'] = async (input) => {
    const dispute: RecommendationDispute = {
      id: `disp-${Date.now()}`,
      advisory_id: input.advisory_id,
      barangay_id: input.barangay_id,
      reason: input.reason,
      farmer_note: input.farmer_note,
      synced: isOnline,
      created_at: new Date().toISOString(),
    };

    if (isOnline) {
      await pushAdvisoryDispute(dispute, state.profile.id);
    }

    setState((s) => ({
      ...s,
      disputes: [dispute, ...s.disputes],
    }));
    return dispute;
  };

  const setPlan = (tier: SubscriptionTier, cycle?: BillingCycle) => {
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        subscription_tier: tier,
        billing_cycle: cycle ?? s.profile.billing_cycle,
      },
    }));
  };

  const setSimulateOffline = (val: boolean) =>
    setState((s) => ({ ...s, simulateOffline: val }));

  const setSimulateStaleCache = (val: boolean) =>
    setState((s) => ({ ...s, simulateStaleCache: val }));

  const syncPendingNow = async () => {
    if (!isOnline) return;
    setState((s) => ({
      ...s,
      rainCheckins: s.rainCheckins.map((r) => ({ ...r, synced: true })),
      harvestReports: s.harvestReports.map((h) => ({ ...h, synced: true })),
      disputes: s.disputes.map((d) => ({ ...d, synced: true })),
      lastSyncedAt: new Date().toISOString(),
      simulateStaleCache: false,
    }));
  };

  const resetSession = () => {
    localStorage.removeItem(STATE_KEY);
    setState(DEFAULT_STATE);
  };

  return (
    <AppStateContext.Provider
      value={{
        ...state,
        isOnline,
        isCacheStale,
        pendingSyncCount,
        activeParcel,
        setActiveParcelId,
        updateProfile,
        updateConsent,
        withdrawConsent,
        completeOnboarding,
        addParcel,
        deleteParcel,
        submitRainCheckIn,
        submitHarvestReport,
        submitDispute,
        setPlan,
        setSimulateOffline,
        setSimulateStaleCache,
        syncPendingNow,
        resetSession,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
