-- ============================================================================
-- Agapay — Satellite-Powered Crop Intelligence for Filipino Farmers
-- Supabase PostgreSQL Schema (Copy-Paste Ready)
-- Aligned with SBIC Workbook (Baybay City, Leyte) & RA 10173 Privacy by Design
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES & RA 10173 INFORMED CONSENT
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone_number text unique,
  role text not null default 'farmer' check (role in ('farmer', 'technician', 'lgu_officer')),
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'fil', 'ceb', 'ilo', 'hil', 'war', 'bik', 'pam', 'pag', 'mdh')),
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro', 'business')),
  billing_cycle text not null default 'yearly' check (billing_cycle in ('monthly', 'yearly')),
  sms_alerts_enabled boolean not null default true,
  barangay_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  location_consent boolean not null default false,
  farm_data_consent boolean not null default false,
  reminders_consent boolean not null default false,
  privacy_policy_accepted boolean not null default false,
  consent_version text not null default '2026.1-RA10173',
  agreed_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index if not exists idx_user_consents_user_id on public.user_consents (user_id);

-- ----------------------------------------------------------------------------
-- 2. BARANGAYS (NAMRIA / PhilGIS + DA-BSWM Soil Baseline)
-- ----------------------------------------------------------------------------
create table if not exists public.barangays (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  municipality text not null default 'Baybay City',
  province text not null default 'Leyte',
  zone_type text not null check (zone_type in ('coastal_lowland', 'alluvial_plain', 'foothill_upland')),
  elevation_m numeric(6, 1) not null default 18.0,
  soil_texture text not null,
  soil_ph numeric(3, 1),
  drainage_class text not null check (drainage_class in ('poor', 'moderate', 'well_drained')),
  center_lat numeric(9, 6) not null,
  center_lng numeric(9, 6) not null,
  cao_baseline_farmers integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint fk_profiles_barangay
  foreign key (barangay_id) references public.barangays (id) on delete set null;

-- ----------------------------------------------------------------------------
-- 3. CROPS & OFFLINE CROP GUIDES (Included in Free Tier)
-- ----------------------------------------------------------------------------
create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  local_name text not null,
  category text not null check (category in ('rice', 'corn', 'root_crop', 'tree_crop')),
  duration_days integer not null,
  water_need text not null check (water_need in ('low', 'medium', 'high')),
  cost_tier text not null check (cost_tier in ('low', 'medium', 'high')),
  flood_risk text not null check (flood_risk in ('low', 'medium', 'high')),
  typical_yield_min_sacks integer not null,
  typical_yield_max_sacks integer not null,
  is_pilot_enabled boolean not null default true
);

create table if not exists public.crop_guides (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops (id) on delete cascade,
  best_soil_moisture_pct text not null,
  planting_steps jsonb not null default '[]'::jsonb,
  drainage_and_wet_tip text not null,
  recommended_varieties text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. FARM PARCELS (Pseudonymized parcel_code + Outlier Flagging)
-- ----------------------------------------------------------------------------
create table if not exists public.farm_parcels (
  id uuid primary key default gen_random_uuid(),
  parcel_code text not null unique default ('AGP-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8))),
  user_id uuid not null references public.profiles (id) on delete cascade,
  barangay_id uuid not null references public.barangays (id) on delete restrict,
  field_name text not null,
  primary_crop_id uuid not null references public.crops (id) on delete restrict,
  area_ha numeric(6, 2) not null check (area_ha > 0 and area_ha <= 500),
  is_outlier_flagged boolean not null default false,
  technician_verified boolean not null default false,
  lat numeric(9, 6),
  lng numeric(9, 6),
  drainage_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_farm_parcels_user on public.farm_parcels (user_id);
create index if not exists idx_farm_parcels_barangay on public.farm_parcels (barangay_id);

-- ----------------------------------------------------------------------------
-- 5. PLANTING LOGS (Drives Aggregated Barangay Crowding)
-- ----------------------------------------------------------------------------
create table if not exists public.planting_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  parcel_id uuid not null references public.farm_parcels (id) on delete cascade,
  barangay_id uuid not null references public.barangays (id) on delete restrict,
  crop_id uuid not null references public.crops (id) on delete restrict,
  variety text,
  hectares_planted numeric(6, 2) not null check (hectares_planted > 0),
  planting_date date not null,
  season_label text not null,
  is_outlier_flagged boolean not null default false,
  source text not null default 'app' check (source in ('app', 'sms')),
  created_at timestamptz not null default now()
);

create index if not exists idx_planting_logs_barangay_crop
  on public.planting_logs (barangay_id, crop_id, season_label);

-- ----------------------------------------------------------------------------
-- 6. HYPER-LOCAL PLANTING ADVISORIES (Mamdani Fuzzy Logic + Sentinel-1/2 + ERA5)
-- ----------------------------------------------------------------------------
create table if not exists public.planting_advisories (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid not null references public.barangays (id) on delete cascade,
  crop_id uuid not null references public.crops (id) on delete cascade,
  grid_cell text not null,
  window_start date not null,
  window_end date not null,
  decision text not null check (decision in ('go', 'wait', 'avoid')),
  headline text not null,
  plain_explanation text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  data_type text not null default 'modeled' check (data_type in ('modeled', 'observed')),
  waterlogging_status text not null check (waterlogging_status in ('low', 'check_field', 'high')),
  soil_moisture_pct integer not null check (soil_moisture_pct between 0 and 100),
  rain_7d_mm numeric(6, 1) not null default 0,
  daily_rain_mm jsonb not null default '[]'::jsonb,
  technician_reviewed boolean not null default false,
  technician_name text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_advisories_barangay_crop
  on public.planting_advisories (barangay_id, crop_id);

-- ----------------------------------------------------------------------------
-- 7. RISK & WATERLOGGING ALERTS
-- ----------------------------------------------------------------------------
create table if not exists public.risk_alerts (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid not null references public.barangays (id) on delete cascade,
  category text not null check (category in ('heavy_rain', 'waterlogging', 'dry_spell', 'planting_window')),
  severity text not null check (severity in ('high', 'medium', 'low', 'info')),
  title text not null,
  action_summary text not null,
  detail_explanation text not null,
  is_active boolean not null default true,
  sms_dispatched boolean not null default false,
  issued_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists idx_risk_alerts_barangay_active
  on public.risk_alerts (barangay_id, is_active);

-- ----------------------------------------------------------------------------
-- 8. ONE-TAP RAIN CHECK-INS & HARVEST FEEDBACK (Forecast Cross-Check Loop)
-- ----------------------------------------------------------------------------
create table if not exists public.rain_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  parcel_id uuid references public.farm_parcels (id) on delete set null,
  barangay_id uuid not null references public.barangays (id) on delete restrict,
  intensity text not null check (intensity in ('none', 'light', 'moderate', 'heavy')),
  lat numeric(9, 6),
  lng numeric(9, 6),
  barometric_hpa numeric(6, 1),
  source text not null default 'app' check (source in ('app', 'sms')),
  observed_at timestamptz not null default now(),
  synced_at timestamptz not null default now()
);

create table if not exists public.harvest_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  parcel_id uuid not null references public.farm_parcels (id) on delete cascade,
  barangay_id uuid not null references public.barangays (id) on delete restrict,
  crop_id uuid not null references public.crops (id) on delete restrict,
  variety text not null,
  yield_sacks_per_ha numeric(6, 1) not null check (yield_sacks_per_ha >= 0 and yield_sacks_per_ha <= 400),
  predicted_min_sacks numeric(6, 1),
  predicted_max_sacks numeric(6, 1),
  harvest_date date not null,
  technician_verified boolean not null default false,
  notes text,
  source text not null default 'app' check (source in ('app', 'sms')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. PRE-PLANTING YIELD ESTIMATES & FORECAST ACCURACY CROSS-CHECK
-- ----------------------------------------------------------------------------
create table if not exists public.yield_estimates (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid not null references public.barangays (id) on delete cascade,
  crop_id uuid not null references public.crops (id) on delete cascade,
  min_sacks_per_ha integer not null,
  max_sacks_per_ha integer not null,
  scale_min integer not null default 20,
  scale_max integer not null default 100,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  soil_moisture_rating text not null,
  rainfall_rating text not null,
  ndvi_index numeric(4, 2),
  updated_at timestamptz not null default now()
);

create table if not exists public.forecast_accuracy_logs (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid not null references public.barangays (id) on delete cascade,
  week_label text not null,
  week_start date not null,
  forecast_rain_mm numeric(6, 1) not null,
  reported_rain_mm numeric(6, 1) not null,
  accuracy_pct integer not null check (accuracy_pct between 0 and 100),
  reporting_farmers integer not null default 0
);

-- ----------------------------------------------------------------------------
-- 10. ACCOUNTABILITY: ADVISORY DISPUTES & DATA SOURCES REGISTER (Day 6 Ethics)
-- ----------------------------------------------------------------------------
create table if not exists public.recommendation_disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  advisory_id uuid references public.planting_advisories (id) on delete set null,
  barangay_id uuid not null references public.barangays (id) on delete restrict,
  reason text not null check (reason in ('rain_mismatch', 'soil_drier', 'soil_wetter', 'crop_timing', 'other')),
  farmer_note text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.data_sources_register (
  id uuid primary key default gen_random_uuid(),
  dataset_name text not null,
  owner text not null,
  update_frequency text not null,
  license_note text not null,
  limitation_note text not null,
  last_reviewed_at date not null default current_date
);

-- ----------------------------------------------------------------------------
-- 11. PRIVACY-SAFE AGGREGATED BARANGAY CROWDING VIEW
-- Enforces RA 10173 & Cold-Start Rule: >= 5 reporting farmers required
-- Zero individual farmer PII exposed to LGU Business dashboards
-- ----------------------------------------------------------------------------
create or replace view public.v_barangay_crowding as
select
  b.id as barangay_id,
  b.name as barangay_name,
  b.municipality,
  c.id as crop_id,
  c.slug as crop_slug,
  c.name as crop_name,
  pl.season_label,
  count(distinct pl.user_id) as reporting_farmers,
  coalesce(sum(pl.hectares_planted), 0)::numeric(10, 2) as total_hectares,
  case
    when count(distinct pl.user_id) < 5 then 'insufficient_data'
    when coalesce(sum(pl.hectares_planted), 0) >= 85 then 'high'
    when coalesce(sum(pl.hectares_planted), 0) >= 50 then 'medium'
    else 'low'
  end as crowding_level
from public.barangays b
cross join public.crops c
left join public.planting_logs pl
  on pl.barangay_id = b.id
  and pl.crop_id = c.id
  and pl.is_outlier_flagged = false
group by b.id, b.name, b.municipality, c.id, c.slug, c.name, pl.season_label;

-- ----------------------------------------------------------------------------
-- 12. ROW-LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_consents enable row level security;
alter table public.farm_parcels enable row level security;
alter table public.planting_logs enable row level security;
alter table public.rain_checkins enable row level security;
alter table public.harvest_reports enable row level security;
alter table public.recommendation_disputes enable row level security;
alter table public.barangays enable row level security;
alter table public.crops enable row level security;
alter table public.crop_guides enable row level security;
alter table public.planting_advisories enable row level security;
alter table public.risk_alerts enable row level security;
alter table public.yield_estimates enable row level security;
alter table public.forecast_accuracy_logs enable row level security;
alter table public.data_sources_register enable row level security;

-- Public / authenticated read on shared agricultural reference & advisory tables
create policy "Public read barangays" on public.barangays for select using (true);
create policy "Public read crops" on public.crops for select using (true);
create policy "Public read crop_guides" on public.crop_guides for select using (true);
create policy "Public read advisories" on public.planting_advisories for select using (true);
create policy "Public read risk_alerts" on public.risk_alerts for select using (true);
create policy "Public read yield_estimates" on public.yield_estimates for select using (true);
create policy "Public read accuracy_logs" on public.forecast_accuracy_logs for select using (true);
create policy "Public read data_sources" on public.data_sources_register for select using (true);

-- Strict user-owned RLS on personal farmer data (RA 10173 compliance)
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own consents" on public.user_consents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own farm parcels" on public.farm_parcels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own planting logs" on public.planting_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own rain checkins" on public.rain_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own harvest reports" on public.harvest_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own disputes" on public.recommendation_disputes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
