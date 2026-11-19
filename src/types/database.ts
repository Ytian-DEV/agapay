import type { SupportedLanguageCode } from '../i18n';

export type UserRole = 'farmer' | 'technician' | 'lgu_officer';
export type SubscriptionTier = 'free' | 'pro' | 'business';
export type BillingCycle = 'monthly' | 'yearly';
export type DecisionStatus = 'go' | 'wait' | 'avoid';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type AlertSeverity = 'high' | 'medium' | 'low' | 'info';
export type AlertCategory = 'heavy_rain' | 'waterlogging' | 'dry_spell' | 'planting_window';
export type RainIntensity = 'none' | 'light' | 'moderate' | 'heavy';
export type CrowdingLevel = 'low' | 'medium' | 'high' | 'insufficient_data';

export interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  role: UserRole;
  preferred_language: SupportedLanguageCode;
  subscription_tier: SubscriptionTier;
  billing_cycle: BillingCycle;
  sms_alerts_enabled: boolean;
  barangay_id: string;
}

export interface UserConsent {
  location_consent: boolean;
  farm_data_consent: boolean;
  reminders_consent: boolean;
  privacy_policy_accepted: boolean;
  consent_version: string;
  agreed_at: string;
  withdrawn_at?: string | null;
}

export interface Barangay {
  id: string;
  code: string;
  name: string;
  municipality: string;
  province: string;
  zone_type: 'coastal_lowland' | 'alluvial_plain' | 'foothill_upland';
  elevation_m: number;
  soil_texture: string;
  soil_ph: number;
  drainage_class: 'poor' | 'moderate' | 'well_drained';
  center_lat: number;
  center_lng: number;
  reporting_farmers: number;
  total_planted_ha: number;
  dominant_crop_slug: string;
}

export type CropCategory =
  | 'rice'
  | 'corn'
  | 'root_crop'
  | 'vegetable'
  | 'legume'
  | 'fruit'
  | 'tree_crop'
  | 'fiber';

export type PlantingSeasonType = 'wet' | 'dry' | 'wet_and_dry' | 'year_round';

export interface Crop {
  id: string;
  slug: string;
  name: string;
  local_name: string;
  category: CropCategory;
  duration_days: number;
  water_need: 'low' | 'medium' | 'high';
  cost_tier: 'low' | 'medium' | 'high';
  flood_risk: 'low' | 'medium' | 'high';
  typical_yield_min_sacks: number;
  typical_yield_max_sacks: number;
  suitability_pct: number;
  planting_season: PlantingSeasonType;
  best_planting_months: number[]; // 1..12
  season_note: string;
  best_soil_moisture: string;
  planting_steps: string[];
  drainage_tip: string;
  varieties: string[];
}

export interface FarmParcel {
  id: string;
  parcel_code: string;
  field_name: string;
  barangay_id: string;
  crop_slug: Crop['slug'];
  area_ha: number;
  is_outlier_flagged: boolean;
  technician_verified: boolean;
  grid_cell: string;
  lat: number;
  lng: number;
  drainage_note: string;
  created_at: string;
}

export interface DailyRainPoint {
  day: string;
  dateNum: string;
  mm: number;
}

export interface PlantingAdvisory {
  id: string;
  barangay_id: string;
  crop_slug: Crop['slug'];
  grid_cell: string;
  window_start: string;
  window_end: string;
  window_label: string;
  decision: DecisionStatus;
  headline: string;
  plain_explanation: string;
  confidence: ConfidenceLevel;
  data_type: 'modeled' | 'observed';
  waterlogging_status: 'low' | 'check_field' | 'high';
  soil_moisture_pct: number;
  rain_7d_mm: number;
  daily_rain: DailyRainPoint[];
  technician_reviewed: boolean;
  technician_name?: string;
  updated_at: string;
}

export interface MapGridCell {
  id: string; // e.g., A1..C3
  barangay_id: string;
  barangay_name: string;
  decision: DecisionStatus;
  confidence: ConfidenceLevel;
  rain_mm: number;
  soil_moisture_pct: number;
  flood_risk: 'low' | 'medium' | 'high';
  summary: string;
  updated_at: string;
}

export interface RiskAlert {
  id: string;
  barangay_id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  action_summary: string;
  detail_explanation: string;
  is_active: boolean;
  sms_dispatched: boolean;
  issued_at: string;
}

export interface RainCheckIn {
  id: string;
  parcel_id: string;
  barangay_id: string;
  intensity: RainIntensity;
  observed_at: string;
  source: 'app' | 'sms';
  synced: boolean;
}

export interface HarvestReport {
  id: string;
  parcel_id: string;
  barangay_id: string;
  crop_slug: Crop['slug'];
  variety: string;
  yield_sacks_per_ha: number;
  harvest_date: string;
  synced: boolean;
  created_at: string;
}

export interface RecommendationDispute {
  id: string;
  advisory_id?: string;
  barangay_id: string;
  reason: 'rain_mismatch' | 'soil_drier' | 'soil_wetter' | 'crop_timing' | 'other';
  farmer_note: string;
  synced: boolean;
  created_at: string;
}

export interface BarangayCrowdingRow {
  barangay_id: string;
  barangay_name: string;
  crop_slug: Crop['slug'];
  crop_name: string;
  reporting_farmers: number;
  total_hectares: number;
  crowding_level: CrowdingLevel;
  cao_fallback_note?: string;
}

export interface ForecastAccuracyPoint {
  week_label: string;
  forecast_mm: number;
  reported_mm: number;
  accuracy_pct: number;
}

export interface DataSourceEntry {
  id: string;
  dataset_name: string;
  owner: string;
  update_frequency: string;
  license_note: string;
  limitation_note: string;
}
