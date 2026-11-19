import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import type {
  Barangay,
  Crop,
  DataSourceEntry,
  FarmParcel,
  ForecastAccuracyPoint,
  HarvestReport,
  PlantingAdvisory,
  Profile,
  RainCheckIn,
  RecommendationDispute,
  RiskAlert,
  UserConsent,
} from '../types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-public-anon-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  return Boolean(value && UUID_REGEX.test(value));
}

export interface DbResult<T = null> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

export interface AuthActionResult {
  ok: boolean;
  user: User | null;
  session: Session | null;
  needsEmailConfirmation: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// 1. REAL SUPABASE AUTHENTICATION (Sign Up, Sign In, Sign Out)
// ---------------------------------------------------------------------------

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  preferredLanguage?: string;
}): Promise<AuthActionResult> {
  if (!supabase) {
    return {
      ok: false,
      user: null,
      session: null,
      needsEmailConfirmation: false,
      error: 'Supabase environment variables are not configured.',
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim() || 'Farmer',
        phone_number: input.phoneNumber?.trim() || null,
        preferred_language: input.preferredLanguage || 'en',
      },
    },
  });

  if (error) {
    return {
      ok: false,
      user: null,
      session: null,
      needsEmailConfirmation: false,
      error: error.message,
    };
  }

  const needsConfirmation = Boolean(data.user && !data.session);

  // If session is immediately active (Confirm Email OFF), ensure profile exists right away
  if (data.session && data.user) {
    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: input.fullName.trim() || 'Farmer',
        phone_number: input.phoneNumber?.trim() || null,
        preferred_language: input.preferredLanguage || 'en',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  }

  return {
    ok: true,
    user: data.user,
    session: data.session,
    needsEmailConfirmation: needsConfirmation,
    error: null,
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthActionResult> {
  if (!supabase) {
    return {
      ok: false,
      user: null,
      session: null,
      needsEmailConfirmation: false,
      error: 'Supabase environment variables are not configured.',
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return {
      ok: false,
      user: null,
      session: null,
      needsEmailConfirmation: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    user: data.user,
    session: data.session,
    needsEmailConfirmation: false,
    error: null,
  };
}

export async function signOutFromSupabase(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// 2. REFERENCE DATA READS (Barangays, Crops + Guides, Advisories, Alerts, etc.)
// ---------------------------------------------------------------------------

export interface ReferenceBundle {
  barangays: Barangay[];
  crops: Crop[];
  advisories: Record<string, PlantingAdvisory>;
  alerts: RiskAlert[];
  accuracySeries: ForecastAccuracyPoint[];
  dataSources: DataSourceEntry[];
  counts: {
    barangays: number;
    crops: number;
    alerts: number;
    advisories: number;
  };
}

export async function fetchReferenceData(): Promise<DbResult<ReferenceBundle>> {
  if (!supabase) {
    return { ok: false, data: null, error: 'Supabase not configured' };
  }

  try {
    const [brgyRes, cropsRes, guidesRes, advRes, alertsRes, accRes, srcRes] =
      await Promise.all([
        supabase.from('barangays').select('*').order('name'),
        supabase.from('crops').select('*').order('name'),
        supabase.from('crop_guides').select('*'),
        supabase.from('planting_advisories').select('*'),
        supabase.from('risk_alerts').select('*').order('issued_at', { ascending: false }),
        supabase.from('forecast_accuracy_logs').select('*').order('week_start', { ascending: true }),
        supabase.from('data_sources_register').select('*'),
      ]);

    const firstError =
      brgyRes.error ||
      cropsRes.error ||
      guidesRes.error ||
      advRes.error ||
      alertsRes.error ||
      accRes.error ||
      srcRes.error;

    if (firstError) {
      return { ok: false, data: null, error: firstError.message };
    }

    const barangays: Barangay[] = (brgyRes.data ?? []).map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      municipality: b.municipality,
      province: b.province,
      zone_type: b.zone_type,
      elevation_m: Number(b.elevation_m),
      soil_texture: b.soil_texture,
      soil_ph: Number(b.soil_ph ?? 6.2),
      drainage_class: b.drainage_class,
      center_lat: Number(b.center_lat),
      center_lng: Number(b.center_lng),
      reporting_farmers: Number(b.cao_baseline_farmers ?? 0),
      total_planted_ha: Number(b.cao_baseline_farmers ?? 0) * 2.5,
      dominant_crop_slug: b.code === 'BBY-HIL' || b.code === 'BBY-PLA' ? 'rice' : 'corn',
    }));

    const guideByCropId = new Map<string, Record<string, unknown>>();
    for (const g of guidesRes.data ?? []) {
      guideByCropId.set(g.crop_id, g);
    }

    const suitabilityMap: Record<string, number> = {
      'sweet-potato': 86,
      rice: 81,
      corn: 78,
      cassava: 74,
      coconut: 70,
    };

    const crops: Crop[] = (cropsRes.data ?? [])
      .filter((c) => c.slug !== 'coconut')
      .map((c) => {
        const g = guideByCropId.get(c.id);
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          local_name: c.local_name,
          category: c.category,
          duration_days: Number(c.duration_days),
          water_need: c.water_need,
          cost_tier: c.cost_tier,
          flood_risk: c.flood_risk,
          typical_yield_min_sacks: Number(c.typical_yield_min_sacks),
          typical_yield_max_sacks: Number(c.typical_yield_max_sacks),
          suitability_pct: suitabilityMap[c.slug] ?? 75,
          best_soil_moisture: (g?.best_soil_moisture_pct as string) ?? '30% – 45%',
          planting_steps: Array.isArray(g?.planting_steps)
            ? (g.planting_steps as string[])
            : [],
          drainage_tip: (g?.drainage_and_wet_tip as string) ?? '',
          varieties: Array.isArray(g?.recommended_varieties)
            ? (g.recommended_varieties as string[])
            : ['Local certified'],
        };
      });

    const cropById = new Map<string, Crop>();
    for (const c of crops) cropById.set(c.id, c);

    const advisories: Record<string, PlantingAdvisory> = {};
    for (const row of advRes.data ?? []) {
      const c = cropById.get(row.crop_id);
      if (!c) continue;
      const rawDaily = Array.isArray(row.daily_rain_mm) ? row.daily_rain_mm : [];
      const dayNames = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
      const daily_rain = rawDaily.map(
        (pt: { day?: string; mm?: number }, idx: number) => ({
          day: dayNames[idx % 7],
          dateNum: String(pt.day ?? '').replace(/^\D+/, '') || String(20 + idx),
          mm: Number(pt.mm ?? 0),
        })
      );
      const start = new Date(row.window_start);
      const end = new Date(row.window_end);
      const window_label = Number.isNaN(start.getTime())
        ? `${row.window_start} – ${row.window_end}`
        : `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.getDate()}`;

      advisories[c.slug] = {
        id: row.id,
        barangay_id: row.barangay_id,
        crop_slug: c.slug,
        grid_cell: row.grid_cell,
        window_start: row.window_start,
        window_end: row.window_end,
        window_label,
        decision: row.decision,
        headline: row.headline,
        plain_explanation: row.plain_explanation,
        confidence: row.confidence,
        data_type: row.data_type,
        waterlogging_status: row.waterlogging_status,
        soil_moisture_pct: Number(row.soil_moisture_pct),
        rain_7d_mm: Number(row.rain_7d_mm),
        daily_rain,
        technician_reviewed: Boolean(row.technician_reviewed),
        technician_name: row.technician_name ?? undefined,
        updated_at: row.updated_at,
      };
    }

    const alerts: RiskAlert[] = (alertsRes.data ?? []).map((a) => ({
      id: a.id,
      barangay_id: a.barangay_id,
      category: a.category,
      severity: a.severity,
      title: a.title,
      action_summary: a.action_summary,
      detail_explanation: a.detail_explanation,
      is_active: Boolean(a.is_active),
      sms_dispatched: Boolean(a.sms_dispatched),
      issued_at: a.issued_at,
    }));

    const accuracySeries: ForecastAccuracyPoint[] = (accRes.data ?? []).map((x) => ({
      week_label: x.week_label,
      forecast_mm: Number(x.forecast_rain_mm),
      reported_mm: Number(x.reported_rain_mm),
      accuracy_pct: Number(x.accuracy_pct),
    }));

    const dataSources: DataSourceEntry[] = (srcRes.data ?? []).map((s) => ({
      id: s.id,
      dataset_name: s.dataset_name,
      owner: s.owner,
      update_frequency: s.update_frequency,
      license_note: s.license_note,
      limitation_note: s.limitation_note,
    }));

    return {
      ok: true,
      data: {
        barangays,
        crops,
        advisories,
        alerts,
        accuracySeries,
        dataSources,
        counts: {
          barangays: barangays.length,
          crops: crops.length,
          alerts: alerts.length,
          advisories: Object.keys(advisories).length,
        },
      },
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: err instanceof Error ? err.message : 'Failed to load reference data',
    };
  }
}

// ---------------------------------------------------------------------------
// 3. AUTHENTICATED USER DATA READS
// ---------------------------------------------------------------------------

export interface UserDataBundle {
  profile: Profile | null;
  consent: UserConsent | null;
  parcels: FarmParcel[];
  rainCheckins: RainCheckIn[];
  harvestReports: HarvestReport[];
  disputes: RecommendationDispute[];
}

export async function fetchUserData(
  userId: string,
  crops: Crop[]
): Promise<DbResult<UserDataBundle>> {
  if (!supabase || !isUuid(userId)) {
    return { ok: false, data: null, error: 'No authenticated Supabase user' };
  }

  try {
    const [profRes, consentRes, parcelsRes, rainRes, harvestRes, dispRes] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('user_consents')
          .select('*')
          .eq('user_id', userId)
          .order('agreed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('farm_parcels')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('rain_checkins')
          .select('*')
          .eq('user_id', userId)
          .order('observed_at', { ascending: false })
          .limit(25),
        supabase
          .from('harvest_reports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(25),
        supabase
          .from('recommendation_disputes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(25),
      ]);

    const firstError =
      profRes.error ||
      consentRes.error ||
      parcelsRes.error ||
      rainRes.error ||
      harvestRes.error ||
      dispRes.error;

    if (firstError) {
      return { ok: false, data: null, error: firstError.message };
    }

    const cropSlugById = new Map<string, Crop['slug']>();
    for (const c of crops) cropSlugById.set(c.id, c.slug);

    const profile: Profile | null = profRes.data
      ? {
          id: profRes.data.id,
          full_name: profRes.data.full_name,
          phone_number: profRes.data.phone_number ?? '',
          role: profRes.data.role,
          preferred_language: profRes.data.preferred_language,
          subscription_tier: profRes.data.subscription_tier,
          billing_cycle: profRes.data.billing_cycle,
          sms_alerts_enabled: Boolean(profRes.data.sms_alerts_enabled),
          barangay_id: profRes.data.barangay_id ?? '',
        }
      : null;

    const consent: UserConsent | null = consentRes.data
      ? {
          location_consent: Boolean(consentRes.data.location_consent),
          farm_data_consent: Boolean(consentRes.data.farm_data_consent),
          reminders_consent: Boolean(consentRes.data.reminders_consent),
          privacy_policy_accepted: Boolean(consentRes.data.privacy_policy_accepted),
          consent_version: consentRes.data.consent_version,
          agreed_at: consentRes.data.agreed_at,
          withdrawn_at: consentRes.data.withdrawn_at,
        }
      : null;

    const parcels: FarmParcel[] = (parcelsRes.data ?? []).map((p) => ({
      id: p.id,
      parcel_code: p.parcel_code,
      field_name: p.field_name,
      barangay_id: p.barangay_id,
      crop_slug: cropSlugById.get(p.primary_crop_id) ?? 'corn',
      area_ha: Number(p.area_ha),
      is_outlier_flagged: Boolean(p.is_outlier_flagged),
      technician_verified: Boolean(p.technician_verified),
      grid_cell: 'B2',
      lat: Number(p.lat ?? 10.7285),
      lng: Number(p.lng ?? 124.7962),
      drainage_note: p.drainage_note ?? '',
      created_at: p.created_at,
    }));

    const rainCheckins: RainCheckIn[] = (rainRes.data ?? []).map((r) => ({
      id: r.id,
      parcel_id: r.parcel_id ?? '',
      barangay_id: r.barangay_id,
      intensity: r.intensity,
      observed_at: r.observed_at,
      source: r.source,
      synced: true,
    }));

    const harvestReports: HarvestReport[] = (harvestRes.data ?? []).map((h) => ({
      id: h.id,
      parcel_id: h.parcel_id,
      barangay_id: h.barangay_id,
      crop_slug: cropSlugById.get(h.crop_id) ?? 'corn',
      variety: h.variety,
      yield_sacks_per_ha: Number(h.yield_sacks_per_ha),
      harvest_date: h.harvest_date,
      synced: true,
      created_at: h.created_at,
    }));

    const disputes: RecommendationDispute[] = (dispRes.data ?? []).map((d) => ({
      id: d.id,
      advisory_id: d.advisory_id ?? undefined,
      barangay_id: d.barangay_id,
      reason: d.reason,
      farmer_note: d.farmer_note ?? '',
      synced: true,
      created_at: d.created_at,
    }));

    return {
      ok: true,
      data: {
        profile,
        consent,
        parcels,
        rainCheckins,
        harvestReports,
        disputes,
      },
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: err instanceof Error ? err.message : 'Failed to load user data',
    };
  }
}

// ---------------------------------------------------------------------------
// 4. REAL SUPABASE WRITES (Profiles, Consents, Parcels, Planting, Rain, Harvest, Disputes)
// ---------------------------------------------------------------------------

export async function upsertUserProfile(
  profile: Profile,
  barangayUuid: string | null
): Promise<DbResult> {
  if (!supabase || !isUuid(profile.id)) {
    return { ok: false, data: null, error: 'Not signed in to Supabase' };
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: profile.id,
      full_name: profile.full_name || 'Farmer',
      phone_number: profile.phone_number?.trim() ? profile.phone_number.trim() : null,
      role: profile.role,
      preferred_language: profile.preferred_language,
      subscription_tier: profile.subscription_tier,
      billing_cycle: profile.billing_cycle,
      sms_alerts_enabled: profile.sms_alerts_enabled,
      barangay_id: isUuid(barangayUuid) ? barangayUuid : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  return { ok: !error, data: null, error: error?.message ?? null };
}

export async function saveUserConsent(
  userId: string,
  consent: UserConsent
): Promise<DbResult> {
  if (!supabase || !isUuid(userId)) {
    return { ok: false, data: null, error: 'Not signed in to Supabase' };
  }

  const { error } = await supabase.from('user_consents').insert({
    user_id: userId,
    location_consent: consent.location_consent,
    farm_data_consent: consent.farm_data_consent,
    reminders_consent: consent.reminders_consent,
    privacy_policy_accepted: consent.privacy_policy_accepted,
    consent_version: consent.consent_version,
    agreed_at: consent.agreed_at,
    withdrawn_at: consent.withdrawn_at ?? null,
  });

  return { ok: !error, data: null, error: error?.message ?? null };
}

export async function insertFarmParcelInDb(input: {
  userId: string;
  barangayUuid: string;
  primaryCropUuid: string;
  fieldName: string;
  areaHa: number;
  isOutlierFlagged: boolean;
  lat: number;
  lng: number;
  drainageNote: string;
}): Promise<DbResult<{ id: string; parcel_code: string; created_at: string }>> {
  if (!supabase || !isUuid(input.userId)) {
    return { ok: false, data: null, error: 'Not signed in to Supabase' };
  }
  if (!isUuid(input.barangayUuid) || !isUuid(input.primaryCropUuid)) {
    return {
      ok: false,
      data: null,
      error: 'Barangays or crops seed data not found in Supabase. Please run supabase/seed.sql.',
    };
  }

  const { data, error } = await supabase
    .from('farm_parcels')
    .insert({
      user_id: input.userId,
      barangay_id: input.barangayUuid,
      primary_crop_id: input.primaryCropUuid,
      field_name: input.fieldName,
      area_ha: input.areaHa,
      is_outlier_flagged: input.isOutlierFlagged,
      lat: input.lat,
      lng: input.lng,
      drainage_note: input.drainageNote,
    })
    .select('id, parcel_code, created_at')
    .single();

  if (error || !data) {
    return { ok: false, data: null, error: error?.message ?? 'Insert parcel failed' };
  }

  // Also record initial planting log so barangay hectares reflect in v_barangay_crowding
  await supabase.from('planting_logs').insert({
    user_id: input.userId,
    parcel_id: data.id,
    barangay_id: input.barangayUuid,
    crop_id: input.primaryCropUuid,
    hectares_planted: input.areaHa,
    planting_date: new Date().toISOString().slice(0, 10),
    season_label: '2026-Wet',
    is_outlier_flagged: input.isOutlierFlagged,
    source: 'app',
  });

  return { ok: true, data, error: null };
}

export async function deleteFarmParcelInDb(parcelId: string): Promise<DbResult> {
  if (!supabase || !isUuid(parcelId)) {
    return { ok: false, data: null, error: null };
  }
  const { error } = await supabase.from('farm_parcels').delete().eq('id', parcelId);
  return { ok: !error, data: null, error: error?.message ?? null };
}

export async function pushRainCheckIn(input: {
  userId: string;
  parcelId: string | null;
  barangayUuid: string;
  intensity: RainCheckIn['intensity'];
  observedAt: string;
  source: 'app' | 'sms';
}): Promise<DbResult<{ id: string }>> {
  if (!supabase || !isUuid(input.userId)) {
    return { ok: false, data: null, error: 'Not signed in to Supabase' };
  }
  if (!isUuid(input.barangayUuid)) {
    return { ok: false, data: null, error: 'Missing Supabase barangay UUID (run seed.sql)' };
  }

  const { data, error } = await supabase
    .from('rain_checkins')
    .insert({
      user_id: input.userId,
      parcel_id: isUuid(input.parcelId) ? input.parcelId : null,
      barangay_id: input.barangayUuid,
      intensity: input.intensity,
      source: input.source,
      observed_at: input.observedAt,
    })
    .select('id')
    .single();

  return { ok: !error && Boolean(data), data: data ?? null, error: error?.message ?? null };
}

export async function pushHarvestReport(input: {
  userId: string;
  parcelId: string;
  barangayUuid: string;
  cropUuid: string;
  variety: string;
  yieldSacksPerHa: number;
  harvestDate: string;
}): Promise<DbResult<{ id: string }>> {
  if (!supabase || !isUuid(input.userId)) {
    return { ok: false, data: null, error: 'Not signed in to Supabase' };
  }
  if (!isUuid(input.parcelId) || !isUuid(input.barangayUuid) || !isUuid(input.cropUuid)) {
    return {
      ok: false,
      data: null,
      error: 'Register a field while signed in so harvest links to a real Supabase parcel.',
    };
  }

  const { data, error } = await supabase
    .from('harvest_reports')
    .insert({
      user_id: input.userId,
      parcel_id: input.parcelId,
      barangay_id: input.barangayUuid,
      crop_id: input.cropUuid,
      variety: input.variety,
      yield_sacks_per_ha: input.yieldSacksPerHa,
      harvest_date: input.harvestDate,
    })
    .select('id')
    .single();

  return { ok: !error && Boolean(data), data: data ?? null, error: error?.message ?? null };
}

export async function pushAdvisoryDispute(input: {
  userId: string;
  advisoryId?: string;
  barangayUuid: string;
  reason: RecommendationDispute['reason'];
  farmerNote: string;
}): Promise<DbResult<{ id: string }>> {
  if (!supabase || !isUuid(input.userId)) {
    return { ok: false, data: null, error: 'Not signed in to Supabase' };
  }
  if (!isUuid(input.barangayUuid)) {
    return { ok: false, data: null, error: 'Missing Supabase barangay UUID' };
  }

  const { data, error } = await supabase
    .from('recommendation_disputes')
    .insert({
      user_id: input.userId,
      advisory_id: isUuid(input.advisoryId) ? input.advisoryId : null,
      barangay_id: input.barangayUuid,
      reason: input.reason,
      farmer_note: input.farmerNote,
    })
    .select('id')
    .single();

  return { ok: !error && Boolean(data), data: data ?? null, error: error?.message ?? null };
}
