import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  HarvestReport,
  RainCheckIn,
  RecommendationDispute,
  FarmParcel,
} from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Syncs a queued rain check-in to Supabase when configured & online.
 * Returns true if persisted remotely, false if kept in local offline queue.
 */
export async function pushRainCheckIn(report: RainCheckIn, userId: string): Promise<boolean> {
  if (!supabase || !navigator.onLine) return false;
  const { error } = await supabase.from('rain_checkins').insert({
    user_id: userId,
    parcel_id: report.parcel_id,
    barangay_id: report.barangay_id,
    intensity: report.intensity,
    source: report.source,
    observed_at: report.observed_at,
  });
  return !error;
}

export async function pushHarvestReport(report: HarvestReport, userId: string): Promise<boolean> {
  if (!supabase || !navigator.onLine) return false;
  const { error } = await supabase.from('harvest_reports').insert({
    user_id: userId,
    parcel_id: report.parcel_id,
    barangay_id: report.barangay_id,
    variety: report.variety,
    yield_sacks_per_ha: report.yield_sacks_per_ha,
    harvest_date: report.harvest_date,
  });
  return !error;
}

export async function pushAdvisoryDispute(
  dispute: RecommendationDispute,
  userId: string
): Promise<boolean> {
  if (!supabase || !navigator.onLine) return false;
  const { error } = await supabase.from('recommendation_disputes').insert({
    user_id: userId,
    advisory_id: dispute.advisory_id ?? null,
    barangay_id: dispute.barangay_id,
    reason: dispute.reason,
    farmer_note: dispute.farmer_note,
  });
  return !error;
}

export async function upsertFarmParcel(parcel: FarmParcel, userId: string): Promise<boolean> {
  if (!supabase || !navigator.onLine) return false;
  const { error } = await supabase.from('farm_parcels').upsert({
    id: parcel.id,
    parcel_code: parcel.parcel_code,
    user_id: userId,
    barangay_id: parcel.barangay_id,
    field_name: parcel.field_name,
    area_ha: parcel.area_ha,
    is_outlier_flagged: parcel.is_outlier_flagged,
    lat: parcel.lat,
    lng: parcel.lng,
    drainage_note: parcel.drainage_note,
  });
  return !error;
}
