import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  Barangay,
  BillingCycle,
  Crop,
  DataSourceEntry,
  FarmParcel,
  ForecastAccuracyPoint,
  HarvestReport,
  PlantingAdvisory,
  Profile,
  RainCheckIn,
  RainIntensity,
  RecommendationDispute,
  RiskAlert,
  SubscriptionTier,
  UserConsent,
} from '../types/database';
import {
  ADVISORIES,
  BARANGAYS,
  CROPS,
  DATA_SOURCES,
  FORECAST_ACCURACY_SERIES,
  INITIAL_ALERTS,
  INITIAL_PARCELS,
} from '../data/seedData';
import {
  deleteFarmParcelInDb,
  fetchReferenceData,
  fetchUserData,
  insertFarmParcelInDb,
  isSupabaseConfigured,
  isUuid,
  pushAdvisoryDispute,
  pushHarvestReport,
  pushRainCheckIn,
  saveUserConsent,
  signInWithEmail,
  signOutFromSupabase,
  signUpWithEmail,
  supabase,
  upsertUserProfile,
  type AuthActionResult,
} from '../lib/supabase';

const STATE_KEY = 'agapay_app_state_v2';

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
    subscription_tier: 'pro',
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
  rainCheckins: [],
  harvestReports: [],
  disputes: [],
  lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  simulateOffline: false,
  simulateStaleCache: false,
};

interface DbCounts {
  barangays: number;
  crops: number;
  alerts: number;
  advisories: number;
}

interface AppStateContextValue extends PersistedState {
  // Live Supabase auth & reference state
  authUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  lastDbError: string | null;
  dbReferenceCounts: DbCounts | null;
  barangays: Barangay[];
  crops: Crop[];
  advisories: Record<string, PlantingAdvisory>;
  alerts: RiskAlert[];
  accuracySeries: ForecastAccuracyPoint[];
  dataSources: DataSourceEntry[];

  // Connectivity & derived values
  isOnline: boolean;
  isCacheStale: boolean;
  pendingSyncCount: number;
  activeParcel: FarmParcel;

  // Auth actions
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    preferredLanguage?: string;
  }) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;

  // Data actions (write to Supabase when signed in & online, else queue offline)
  setActiveParcelId: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  updateConsent: (patch: Partial<UserConsent>) => Promise<void>;
  withdrawConsent: () => Promise<void>;
  completeOnboarding: (
    parcel?: Omit<FarmParcel, 'id' | 'parcel_code' | 'created_at'>,
    profilePatch?: Partial<Profile>,
    consentPatch?: Partial<UserConsent>
  ) => Promise<void>;
  addParcel: (
    parcel: Omit<FarmParcel, 'id' | 'parcel_code' | 'created_at'>
  ) => Promise<FarmParcel>;
  deleteParcel: (id: string) => Promise<void>;
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
  setPlan: (tier: SubscriptionTier, cycle?: BillingCycle) => Promise<void>;
  setSimulateOffline: (val: boolean) => void;
  setSimulateStaleCache: (val: boolean) => void;
  syncPendingNow: () => Promise<void>;
  refreshFromSupabase: () => Promise<void>;
  resetSession: () => Promise<void>;
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
        parcels:
          parsed.parcels && parsed.parcels.length > 0
            ? parsed.parcels
            : DEFAULT_STATE.parcels,
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

  // Live Supabase auth & reference tables
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [lastDbError, setLastDbError] = useState<string | null>(null);
  const [dbReferenceCounts, setDbReferenceCounts] = useState<DbCounts | null>(null);

  const [barangays, setBarangays] = useState<Barangay[]>(BARANGAYS);
  const [crops, setCrops] = useState<Crop[]>(CROPS);
  const [advisories, setAdvisories] = useState<Record<string, PlantingAdvisory>>(ADVISORIES);
  const [alerts, setAlerts] = useState<RiskAlert[]>(INITIAL_ALERTS);
  const [accuracySeries, setAccuracySeries] =
    useState<ForecastAccuracyPoint[]>(FORECAST_ACCURACY_SERIES);
  const [dataSources, setDataSources] = useState<DataSourceEntry[]>(DATA_SOURCES);

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
  const isAuthenticated = Boolean(authUser && isUuid(authUser.id));

  // Helper: map any barangay id/code/name to the real Supabase UUID when available
  const resolveBarangayUuid = useCallback(
    (idOrName: string): string => {
      if (isUuid(idOrName)) return idOrName;
      const lower = idOrName.toLowerCase().replace(/^brgy-/, '');
      const match = barangays.find(
        (b) =>
          b.id === idOrName ||
          b.name.toLowerCase() === lower ||
          b.code.toLowerCase() === lower
      );
      return match?.id ?? barangays[0]?.id ?? idOrName;
    },
    [barangays]
  );

  const resolveCropUuid = useCallback(
    (slug: Crop['slug']): string => {
      const match = crops.find((c) => c.slug === slug);
      return match?.id ?? crops[0]?.id ?? slug;
    },
    [crops]
  );

  // 1. Load live reference tables from Supabase on startup
  const loadReferenceFromSupabase = useCallback(async (): Promise<Crop[]> => {
    if (!isSupabaseConfigured || !navigator.onLine) return crops;
    const res = await fetchReferenceData();
    if (!res.ok || !res.data) {
      setLastDbError(res.error ?? 'Could not reach Supabase reference tables');
      return crops;
    }

    setLastDbError(null);
    setDbReferenceCounts(res.data.counts);

    if (res.data.barangays.length > 0) setBarangays(res.data.barangays);
    if (res.data.crops.length > 0) setCrops(res.data.crops);
    if (Object.keys(res.data.advisories).length > 0) {
      setAdvisories((prev) => ({ ...prev, ...res.data!.advisories }));
    }
    if (res.data.alerts.length > 0) setAlerts(res.data.alerts);
    if (res.data.accuracySeries.length > 0) setAccuracySeries(res.data.accuracySeries);
    if (res.data.dataSources.length > 0) setDataSources(res.data.dataSources);

    return res.data.crops.length > 0 ? res.data.crops : crops;
  }, [crops]);

  // 2. Load authenticated user's profile, consents, parcels, and reports from Supabase
  const hydrateUserFromSupabase = useCallback(
    async (user: User, liveCrops: Crop[]) => {
      const res = await fetchUserData(user.id, liveCrops);
      if (!res.ok || !res.data) {
        setLastDbError(res.error ?? 'Failed to load user records from Supabase');
        return;
      }

      setLastDbError(null);
      const userData = res.data;

      setState((prev) => {
        const nextProfile: Profile = userData.profile
          ? userData.profile
          : {
              ...prev.profile,
              id: user.id,
              full_name:
                (user.user_metadata?.full_name as string | undefined) ||
                user.email?.split('@')[0] ||
                prev.profile.full_name,
              phone_number:
                (user.user_metadata?.phone_number as string | undefined) ||
                prev.profile.phone_number,
            };

        const nextParcels =
          userData.parcels.length > 0 ? userData.parcels : prev.parcels;

        return {
          ...prev,
          hasCompletedOnboarding:
            prev.hasCompletedOnboarding ||
            Boolean(userData.profile && userData.parcels.length > 0),
          profile: nextProfile,
          consent: userData.consent ?? prev.consent,
          parcels: nextParcels,
          activeParcelId:
            userData.parcels.length > 0 ? userData.parcels[0].id : prev.activeParcelId,
          rainCheckins: userData.rainCheckins,
          harvestReports: userData.harvestReports,
          disputes: userData.disputes,
          lastSyncedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Subscribe to real Supabase Auth session on mount
  useEffect(() => {
    let active = true;

    async function init() {
      const liveCrops = await loadReferenceFromSupabase();
      if (!supabase) {
        if (active) setAuthLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      if (active) {
        setAuthUser(sessionUser);
        setAuthLoading(false);
      }
      if (sessionUser && active) {
        await hydrateUserFromSupabase(sessionUser, liveCrops);
      }
    }

    void init();

    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setAuthUser(nextUser);
      if (nextUser) {
        void loadReferenceFromSupabase().then((liveCrops) =>
          hydrateUserFromSupabase(nextUser, liveCrops)
        );
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCacheStale = useMemo(() => {
    if (state.simulateStaleCache) return true;
    const ageMs = Date.now() - new Date(state.lastSyncedAt).getTime();
    return ageMs > 72 * 60 * 60 * 1000;
  }, [state.lastSyncedAt, state.simulateStaleCache]);

  const activeParcel = useMemo(() => {
    return state.parcels.find((p) => p.id === state.activeParcelId) ?? state.parcels[0];
  }, [state.parcels, state.activeParcelId]);

  const pendingSyncCount = useMemo(() => {
    return (
      state.rainCheckins.filter((r) => !r.synced).length +
      state.harvestReports.filter((h) => !h.synced).length +
      state.disputes.filter((d) => !d.synced).length
    );
  }, [state.rainCheckins, state.harvestReports, state.disputes]);

  // Auth methods
  const signUp: AppStateContextValue['signUp'] = async (input) => {
    const res = await signUpWithEmail(input);
    if (res.ok && res.user) {
      setLastDbError(null);
      if (res.session) {
        setAuthUser(res.user);
        setState((s) => ({
          ...s,
          profile: {
            ...s.profile,
            id: res.user!.id,
            full_name: input.fullName.trim() || s.profile.full_name,
            phone_number: input.phoneNumber?.trim() || '',
          },
        }));
      }
    } else if (res.error) {
      setLastDbError(res.error);
    }
    return res;
  };

  const signIn: AppStateContextValue['signIn'] = async (email, password) => {
    const res = await signInWithEmail(email, password);
    if (res.ok && res.user) {
      setLastDbError(null);
      setAuthUser(res.user);
      const liveCrops = await loadReferenceFromSupabase();
      await hydrateUserFromSupabase(res.user, liveCrops);
    } else if (res.error) {
      setLastDbError(res.error);
    }
    return res;
  };

  const signOut = async () => {
    await signOutFromSupabase();
    setAuthUser(null);
    localStorage.removeItem(STATE_KEY);
    setState(DEFAULT_STATE);
  };

  const setActiveParcelId = (id: string) =>
    setState((s) => ({ ...s, activeParcelId: id }));

  const updateProfile = async (patch: Partial<Profile>) => {
    let mergedProfile: Profile = { ...state.profile, ...patch };
    if (authUser && isUuid(authUser.id)) {
      mergedProfile = { ...mergedProfile, id: authUser.id };
    }
    setState((s) => ({ ...s, profile: mergedProfile }));

    if (isOnline && isUuid(mergedProfile.id)) {
      const res = await upsertUserProfile(
        mergedProfile,
        resolveBarangayUuid(mergedProfile.barangay_id)
      );
      if (!res.ok && res.error) setLastDbError(res.error);
      else setLastDbError(null);
    }
  };

  const updateConsent = async (patch: Partial<UserConsent>) => {
    const nextConsent: UserConsent = {
      ...state.consent,
      ...patch,
      withdrawn_at: null,
    };
    setState((s) => ({ ...s, consent: nextConsent }));

    if (isOnline && authUser && isUuid(authUser.id)) {
      const res = await saveUserConsent(authUser.id, nextConsent);
      if (!res.ok && res.error) setLastDbError(res.error);
      else setLastDbError(null);
    }
  };

  const withdrawConsent = async () => {
    const withdrawn: UserConsent = {
      ...state.consent,
      location_consent: false,
      farm_data_consent: false,
      reminders_consent: false,
      privacy_policy_accepted: false,
      withdrawn_at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, consent: withdrawn }));

    if (isOnline && authUser && isUuid(authUser.id)) {
      const res = await saveUserConsent(authUser.id, withdrawn);
      if (!res.ok && res.error) setLastDbError(res.error);
    }
  };

  const addParcel: AppStateContextValue['addParcel'] = async (input) => {
    const brgyUuid = resolveBarangayUuid(input.barangay_id);
    const cropUuid = resolveCropUuid(input.crop_slug);
    const isOutlier = input.area_ha > 25;

    let createdParcel: FarmParcel = {
      ...input,
      barangay_id: brgyUuid,
      id: `parcel-${Date.now()}`,
      parcel_code: `AGP-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
      is_outlier_flagged: isOutlier,
      created_at: new Date().toISOString(),
    };

    if (isOnline && authUser && isUuid(authUser.id)) {
      // Ensure profile exists before inserting parcel FK
      await upsertUserProfile({ ...state.profile, id: authUser.id }, brgyUuid);

      const dbRes = await insertFarmParcelInDb({
        userId: authUser.id,
        barangayUuid: brgyUuid,
        primaryCropUuid: cropUuid,
        fieldName: input.field_name,
        areaHa: input.area_ha,
        isOutlierFlagged: isOutlier,
        lat: input.lat,
        lng: input.lng,
        drainageNote: input.drainage_note,
      });

      if (dbRes.ok && dbRes.data) {
        setLastDbError(null);
        createdParcel = {
          ...createdParcel,
          id: dbRes.data.id,
          parcel_code: dbRes.data.parcel_code,
          created_at: dbRes.data.created_at,
        };
      } else if (dbRes.error) {
        setLastDbError(dbRes.error);
      }
    }

    setState((s) => {
      // Replace seed mock parcels once a real Supabase parcel is created
      const existingReal = s.parcels.filter((p) => isUuid(p.id) || !isUuid(createdParcel.id));
      return {
        ...s,
        parcels: [createdParcel, ...existingReal],
        activeParcelId: createdParcel.id,
        lastSyncedAt: new Date().toISOString(),
      };
    });

    return createdParcel;
  };

  const deleteParcel = async (id: string) => {
    if (isOnline && isUuid(id)) {
      const res = await deleteFarmParcelInDb(id);
      if (!res.ok && res.error) setLastDbError(res.error);
    }

    setState((s) => {
      const remaining = s.parcels.filter((p) => p.id !== id);
      const safeParcels = remaining.length > 0 ? remaining : INITIAL_PARCELS;
      return {
        ...s,
        parcels: safeParcels,
        activeParcelId: s.activeParcelId === id ? safeParcels[0].id : s.activeParcelId,
      };
    });
  };

  const completeOnboarding: AppStateContextValue['completeOnboarding'] = async (
    parcel,
    profilePatch,
    consentPatch
  ) => {
    const nextProfile: Profile = {
      ...state.profile,
      ...(profilePatch ?? {}),
      id: authUser?.id ?? state.profile.id,
    };
    const nextConsent: UserConsent = {
      ...state.consent,
      ...(consentPatch ?? {}),
      agreed_at: new Date().toISOString(),
      withdrawn_at: null,
    };

    setState((s) => ({
      ...s,
      profile: nextProfile,
      consent: nextConsent,
      hasCompletedOnboarding: true,
      lastSyncedAt: new Date().toISOString(),
    }));

    if (isOnline && authUser && isUuid(authUser.id)) {
      const brgyUuid = resolveBarangayUuid(nextProfile.barangay_id);
      const profRes = await upsertUserProfile(nextProfile, brgyUuid);
      if (!profRes.ok && profRes.error) setLastDbError(profRes.error);

      const consentRes = await saveUserConsent(authUser.id, nextConsent);
      if (!consentRes.ok && consentRes.error) setLastDbError(consentRes.error);
    }

    if (parcel) {
      await addParcel(parcel);
    }
  };

  const submitRainCheckIn = async (
    intensity: RainIntensity,
    parcelId?: string
  ): Promise<RainCheckIn> => {
    const targetParcel = state.parcels.find((p) => p.id === parcelId) ?? activeParcel;
    const brgyUuid = resolveBarangayUuid(targetParcel.barangay_id);
    const observedAt = new Date().toISOString();

    let synced = false;
    let id = `rc-${Date.now()}`;

    if (isOnline && authUser && isUuid(authUser.id)) {
      const res = await pushRainCheckIn({
        userId: authUser.id,
        parcelId: isUuid(targetParcel.id) ? targetParcel.id : null,
        barangayUuid: brgyUuid,
        intensity,
        observedAt,
        source: 'app',
      });
      if (res.ok && res.data) {
        synced = true;
        id = res.data.id;
        setLastDbError(null);
      } else if (res.error) {
        setLastDbError(res.error);
      }
    }

    const entry: RainCheckIn = {
      id,
      parcel_id: targetParcel.id,
      barangay_id: brgyUuid,
      intensity,
      observed_at: observedAt,
      source: 'app',
      synced,
    };

    setState((s) => ({
      ...s,
      rainCheckins: [entry, ...s.rainCheckins],
      lastSyncedAt: synced ? new Date().toISOString() : s.lastSyncedAt,
    }));
    return entry;
  };

  const submitHarvestReport: AppStateContextValue['submitHarvestReport'] = async (
    input
  ) => {
    const targetParcel =
      state.parcels.find((p) => p.id === input.parcel_id) ?? activeParcel;
    const brgyUuid = resolveBarangayUuid(targetParcel.barangay_id);
    const cropUuid = resolveCropUuid(input.crop_slug);

    let synced = false;
    let id = `hr-${Date.now()}`;

    if (isOnline && authUser && isUuid(authUser.id)) {
      const res = await pushHarvestReport({
        userId: authUser.id,
        parcelId: targetParcel.id,
        barangayUuid: brgyUuid,
        cropUuid,
        variety: input.variety,
        yieldSacksPerHa: input.yield_sacks_per_ha,
        harvestDate: input.harvest_date,
      });
      if (res.ok && res.data) {
        synced = true;
        id = res.data.id;
        setLastDbError(null);
      } else if (res.error) {
        setLastDbError(res.error);
      }
    }

    const report: HarvestReport = {
      id,
      parcel_id: targetParcel.id,
      barangay_id: brgyUuid,
      crop_slug: input.crop_slug,
      variety: input.variety,
      yield_sacks_per_ha: input.yield_sacks_per_ha,
      harvest_date: input.harvest_date,
      synced,
      created_at: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      harvestReports: [report, ...s.harvestReports],
      lastSyncedAt: synced ? new Date().toISOString() : s.lastSyncedAt,
    }));
    return report;
  };

  const submitDispute: AppStateContextValue['submitDispute'] = async (input) => {
    const brgyUuid = resolveBarangayUuid(input.barangay_id);
    let synced = false;
    let id = `disp-${Date.now()}`;

    if (isOnline && authUser && isUuid(authUser.id)) {
      const res = await pushAdvisoryDispute({
        userId: authUser.id,
        advisoryId: input.advisory_id,
        barangayUuid: brgyUuid,
        reason: input.reason,
        farmerNote: input.farmer_note,
      });
      if (res.ok && res.data) {
        synced = true;
        id = res.data.id;
        setLastDbError(null);
      } else if (res.error) {
        setLastDbError(res.error);
      }
    }

    const dispute: RecommendationDispute = {
      id,
      advisory_id: input.advisory_id,
      barangay_id: brgyUuid,
      reason: input.reason,
      farmer_note: input.farmer_note,
      synced,
      created_at: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      disputes: [dispute, ...s.disputes],
    }));
    return dispute;
  };

  const setPlan = async (tier: SubscriptionTier, cycle?: BillingCycle) => {
    await updateProfile({
      subscription_tier: tier,
      billing_cycle: cycle ?? state.profile.billing_cycle,
    });
  };

  const setSimulateOffline = (val: boolean) =>
    setState((s) => ({ ...s, simulateOffline: val }));

  const setSimulateStaleCache = (val: boolean) =>
    setState((s) => ({ ...s, simulateStaleCache: val }));

  const syncPendingNow = async () => {
    if (!isOnline) return;
    const liveCrops = await loadReferenceFromSupabase();

    if (!authUser || !isUuid(authUser.id)) {
      setState((s) => ({
        ...s,
        lastSyncedAt: new Date().toISOString(),
        simulateStaleCache: false,
      }));
      return;
    }

    // Flush unsynced rain check-ins
    const updatedRains = await Promise.all(
      state.rainCheckins.map(async (r) => {
        if (r.synced) return r;
        const res = await pushRainCheckIn({
          userId: authUser.id,
          parcelId: isUuid(r.parcel_id) ? r.parcel_id : null,
          barangayUuid: resolveBarangayUuid(r.barangay_id),
          intensity: r.intensity,
          observedAt: r.observed_at,
          source: r.source,
        });
        if (!res.ok && res.error) setLastDbError(res.error);
        return res.ok && res.data ? { ...r, id: res.data.id, synced: true } : r;
      })
    );

    // Flush unsynced harvest reports
    const updatedHarvests = await Promise.all(
      state.harvestReports.map(async (h) => {
        if (h.synced) return h;
        const res = await pushHarvestReport({
          userId: authUser.id,
          parcelId: h.parcel_id,
          barangayUuid: resolveBarangayUuid(h.barangay_id),
          cropUuid: resolveCropUuid(h.crop_slug),
          variety: h.variety,
          yieldSacksPerHa: h.yield_sacks_per_ha,
          harvestDate: h.harvest_date,
        });
        if (!res.ok && res.error) setLastDbError(res.error);
        return res.ok && res.data ? { ...h, id: res.data.id, synced: true } : h;
      })
    );

    // Flush unsynced disputes
    const updatedDisputes = await Promise.all(
      state.disputes.map(async (d) => {
        if (d.synced) return d;
        const res = await pushAdvisoryDispute({
          userId: authUser.id,
          advisoryId: d.advisory_id,
          barangayUuid: resolveBarangayUuid(d.barangay_id),
          reason: d.reason,
          farmerNote: d.farmer_note,
        });
        if (!res.ok && res.error) setLastDbError(res.error);
        return res.ok && res.data ? { ...d, id: res.data.id, synced: true } : d;
      })
    );

    setState((s) => ({
      ...s,
      rainCheckins: updatedRains,
      harvestReports: updatedHarvests,
      disputes: updatedDisputes,
      lastSyncedAt: new Date().toISOString(),
      simulateStaleCache: false,
    }));

    await hydrateUserFromSupabase(authUser, liveCrops);
  };

  const refreshFromSupabase = async () => {
    const liveCrops = await loadReferenceFromSupabase();
    if (authUser) {
      await hydrateUserFromSupabase(authUser, liveCrops);
    }
  };

  const resetSession = async () => {
    await signOut();
  };

  return (
    <AppStateContext.Provider
      value={{
        ...state,
        authUser,
        isAuthenticated,
        authLoading,
        lastDbError,
        dbReferenceCounts,
        barangays,
        crops,
        advisories,
        alerts,
        accuracySeries,
        dataSources,
        isOnline,
        isCacheStale,
        pendingSyncCount,
        activeParcel,
        signUp,
        signIn,
        signOut,
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
        refreshFromSupabase,
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
