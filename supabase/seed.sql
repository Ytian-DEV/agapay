-- ============================================================================
-- Agapay — Realistic Seed Data for Baybay City, Leyte
-- Run after supabase/schema.sql in Supabase SQL Editor
-- ============================================================================

-- 1. Baybay City Barangays (Coastal lowlands to Mount Pangasugan foothills)
insert into public.barangays (code, name, municipality, province, zone_type, elevation_m, soil_texture, soil_ph, drainage_class, center_lat, center_lng, cao_baseline_farmers)
values
  ('BBY-GAB', 'Gabas', 'Baybay City', 'Leyte', 'alluvial_plain', 16.5, 'Clay loam', 6.1, 'moderate', 10.728500, 124.796200, 38),
  ('BBY-PAN', 'Pangasugan', 'Baybay City', 'Leyte', 'foothill_upland', 48.0, 'Sandy clay loam', 5.9, 'well_drained', 10.744100, 124.791800, 44),
  ('BBY-HIL', 'Hilapnitan', 'Baybay City', 'Leyte', 'alluvial_plain', 14.0, 'Silty clay loam', 6.3, 'moderate', 10.713400, 124.805100, 31),
  ('BBY-CAR', 'Caridad', 'Baybay City', 'Leyte', 'coastal_lowland', 8.5, 'Clay', 6.4, 'poor', 10.701200, 124.812400, 27),
  ('BBY-PLA', 'Plaridel', 'Baybay City', 'Leyte', 'coastal_lowland', 6.0, 'Heavy clay', 6.2, 'poor', 10.678900, 124.801300, 22),
  ('BBY-BUB', 'Bubon', 'Baybay City', 'Leyte', 'foothill_upland', 62.0, 'Loam', 5.8, 'well_drained', 10.692400, 124.828000, 19),
  ('BBY-GUA', 'Guadalupe', 'Baybay City', 'Leyte', 'coastal_lowland', 11.0, 'Silty loam', 6.2, 'moderate', 10.716000, 124.798500, 4)
on conflict (code) do nothing;

-- 2. Philippine Smallholder Crops (Rice, Corn, Root Crops, Coconut)
insert into public.crops (slug, name, local_name, category, duration_days, water_need, cost_tier, flood_risk, typical_yield_min_sacks, typical_yield_max_sacks, is_pilot_enabled)
values
  ('corn', 'Corn', 'Mais', 'corn', 95, 'low', 'medium', 'high', 48, 60, true),
  ('rice', 'Rice (Palay)', 'Palay / Humay', 'rice', 115, 'high', 'high', 'medium', 72, 92, true),
  ('sweet-potato', 'Sweet Potato', 'Kamote', 'root_crop', 90, 'medium', 'low', 'low', 110, 145, true),
  ('cassava', 'Cassava', 'Balanghoy / Kamoteng Kahoy', 'root_crop', 240, 'low', 'low', 'medium', 140, 185, true),
  ('coconut', 'Coconut', 'Niyog / Lubi', 'tree_crop', 365, 'medium', 'low', 'low', 45, 65, false)
on conflict (slug) do nothing;

-- 3. Offline Crop & Drainage Guides (Available on Free Tier)
insert into public.crop_guides (crop_id, best_soil_moisture_pct, planting_steps, drainage_and_wet_tip, recommended_varieties)
select
  c.id,
  case c.slug
    when 'corn' then '25% – 35% (moist, never standing water)'
    when 'rice' then '60% – 85% (puddled or saturated paddy)'
    when 'sweet-potato' then '30% – 45% (loose, well-aerated ridges)'
    else '25% – 40% (well-drained loam)'
  end,
  case c.slug
    when 'corn' then '["Prepare raised beds 15–20 cm high before wet months","Sow 2 seeds per hill at 75 cm × 25 cm spacing","Apply basal organic + NPK fertilizer at planting","Hilling-up at 25–30 days after emergence to stabilize stalks"]'::jsonb
    when 'rice' then '["Level paddy and repair bunds to control water depth","Soak certified seeds 24h and incubate 24–36h before sowing","Transplant 18–21 day seedlings at 20 cm × 20 cm spacing","Keep 2–5 cm water depth; drain 10 days before harvest"]'::jsonb
    when 'sweet-potato' then '["Build 30 cm raised mounds or ridges along field contour","Plant 25–30 cm healthy vine cuttings at 45° angle","Weed lightly within first 30 days until vines cover soil","Check tubers at 90 days; harvest promptly before heavy monsoon rains"]'::jsonb
    else '["Cut mature stems 20–25 cm long with 5–7 nodes","Plant on raised ridges spaced 1 m × 0.75 m","Ensure perimeter trenches prevent root rot"]'::jsonb
  end,
  case c.slug
    when 'corn' then 'Corn seedlings rot quickly in standing water. Dig shallow perimeter drainage canals and raise ridges if 7-day rain exceeds 40 mm.'
    when 'rice' then 'Use submergence-tolerant varieties (NSIC Rc 194) in low-lying coastal barangays like Caridad and Plaridel.'
    when 'sweet-potato' then 'High ridges (30 cm) prevent tuber rot during Leyte heavy downpours and make sweet potato resilient when corn plots flood.'
    else 'Avoid planting in waterlogged depressions; keep contour ditches clear.'
  end,
  case c.slug
    when 'corn' then array['IPB Var 6 (White)', 'VisCA White Corn', 'OPV Yellow Glutinous']
    when 'rice' then array['NSIC Rc 222', 'NSIC Rc 160', 'NSIC Rc 194 (Submarino)']
    when 'sweet-potato' then array['VSP-6 (VSU)', 'NSIC SP-30', 'Super Bureau']
    else array['Golden Yellow', 'Lakan 1']
  end
from public.crops c
where c.slug in ('corn', 'rice', 'sweet-potato', 'cassava');

-- 4. Hyper-Local Planting Advisories for Brgy. Gabas
insert into public.planting_advisories (
  barangay_id, crop_id, grid_cell, window_start, window_end, decision,
  headline, plain_explanation, confidence, data_type, waterlogging_status,
  soil_moisture_pct, rain_7d_mm, daily_rain_mm, technician_reviewed, technician_name
)
select
  b.id,
  c.id,
  'B2',
  '2026-11-20',
  '2026-11-28',
  case c.slug
    when 'corn' then 'wait'
    when 'sweet-potato' then 'go'
    else 'go'
  end,
  case c.slug
    when 'corn' then 'Wait 2–3 days & check drainage'
    when 'sweet-potato' then 'Good window for ridge planting'
    else 'Ready for paddy land prep'
  end,
  case c.slug
    when 'corn' then 'Sentinel-1 radar shows wet surface soil (38%) after recent rain. Clear field ditches and check for standing water before sowing corn.'
    when 'sweet-potato' then 'Moderate rainfall and loose soil moisture support vine rooting on raised ridges with low waterlogging risk.'
    else 'Consistent 7-day rainfall (42 mm) supports puddling and transplanting in alluvial lowland plots.'
  end,
  'medium',
  'modeled',
  case c.slug when 'corn' then 'check_field' else 'low' end,
  38,
  42.0,
  '[{"day":"Nov 20","mm":2},{"day":"Nov 21","mm":4},{"day":"Nov 22","mm":6},{"day":"Nov 23","mm":9},{"day":"Nov 24","mm":14},{"day":"Nov 25","mm":5},{"day":"Nov 26","mm":2}]'::jsonb,
  true,
  'Engr. M. Santos (Baybay CAO)'
from public.barangays b
join public.crops c on c.slug in ('corn', 'rice', 'sweet-potato')
where b.code = 'BBY-GAB';

-- 5. Risk & Waterlogging Alerts
insert into public.risk_alerts (barangay_id, category, severity, title, action_summary, detail_explanation, is_active, sms_dispatched)
select
  b.id,
  a.category,
  a.severity,
  a.title,
  a.action_summary,
  a.detail_explanation,
  a.is_active,
  a.sms_dispatched
from public.barangays b
cross join (
  values
    ('heavy_rain', 'high', 'Heavy rain expected, Nov 18', 'Delay corn sowing by 3 days', 'Downscaled PAGASA & ERA5-Land rainfall shows 35–50 mm over 24 hours. Wait until standing water clears before land prep.', true, true),
    ('waterlogging', 'medium', 'Waterlogging risk in low plots', 'Clear perimeter ditches first', 'Sentinel-1 SAR backscatter indicates saturated topsoil in lower Gabas and Caridad parcels. Check drainage before planting corn.', true, true),
    ('dry_spell', 'low', 'Brief dry spell, Nov 24–27', 'Water young seedlings early morning', 'Light rain (<5 mm/day) expected late next week. Mulch young corn and sweet potato ridges to hold moisture.', true, false),
    ('planting_window', 'info', 'Corn planting window opens Nov 20', 'Prepare seeds and raised beds', 'Soil drainage is projected to improve after Nov 19, opening a 9-day planting window for Brgy. Gabas.', true, false)
) as a(category, severity, title, action_summary, detail_explanation, is_active, sms_dispatched)
where b.code = 'BBY-GAB';

-- 6. Pre-Planting Yield Estimates (sacks/ha with uncertainty range)
insert into public.yield_estimates (barangay_id, crop_id, min_sacks_per_ha, max_sacks_per_ha, scale_min, scale_max, confidence, soil_moisture_rating, rainfall_rating, ndvi_index)
select
  b.id,
  c.id,
  c.typical_yield_min_sacks,
  c.typical_yield_max_sacks,
  case c.slug when 'corn' then 30 when 'rice' then 50 else 80 end,
  case c.slug when 'corn' then 80 when 'rice' then 115 else 175 end,
  'medium',
  'Good',
  'Normal',
  0.68
from public.barangays b
join public.crops c on c.slug in ('corn', 'rice', 'sweet-potato')
where b.code = 'BBY-GAB';

-- 7. Forecast Accuracy Cross-Check History (6-week series)
insert into public.forecast_accuracy_logs (barangay_id, week_label, week_start, forecast_rain_mm, reported_rain_mm, accuracy_pct, reporting_farmers)
select
  b.id,
  w.week_label,
  w.week_start::date,
  w.forecast_mm,
  w.reported_mm,
  w.acc_pct,
  w.farmers
from public.barangays b
cross join (
  values
    ('6 wks ago', '2026-10-05', 28.0, 22.0, 72, 14),
    ('5 wks ago', '2026-10-12', 44.0, 38.0, 76, 17),
    ('4 wks ago', '2026-10-19', 56.0, 52.0, 81, 21),
    ('3 wks ago', '2026-10-26', 31.0, 36.0, 77, 19),
    ('2 wks ago', '2026-11-02', 41.0, 37.0, 80, 23),
    ('This week', '2026-11-09', 46.0, 42.0, 82, 26)
) as w(week_label, week_start, forecast_mm, reported_mm, acc_pct, farmers)
where b.code = 'BBY-GAB';

-- 8. Data Sources & Attribution Register (Day 6 Data Ethics)
insert into public.data_sources_register (dataset_name, owner, update_frequency, license_note, limitation_note)
values
  ('Sentinel-1 C-band SAR (VV/VH)', 'ESA / PhilSA DATOS Copernicus', 'Every 6–12 days', 'Copernicus Open Access (attribution required)', 'Speckle filtering required; terrain distortion on steep Mount Pangasugan slopes.'),
  ('Sentinel-2 Optical MSI (NDVI/EVI/NDWI)', 'ESA / PhilSA Copernicus Mirror', 'Every 5 days', 'Copernicus Open Access (attribution required)', 'Cloud cover during monsoon limits optical passes; paired with Sentinel-1 radar.'),
  ('PAGASA Synoptic & ECMWF ERA5-Land', 'PAGASA & Copernicus C3S', 'Hourly to daily', 'Public / Open research terms', '~9 km grid downscaled with 30 m DEM; calibrated against farmer rain check-ins.'),
  ('30 m Digital Elevation Model (SRTM) & Barangay Boundaries', 'NAMRIA / PhilGIS / Baybay City LGU', 'Annual', 'Public domain / LGU data sharing', 'Minor cadastral boundary differences; used for slope and drainage modeling.'),
  ('Soil Properties Baseline', 'DA-BSWM (Bureau of Soils & Water Management)', '2–3 year cycle', 'Philippine government agricultural data', 'Coarse regional mapping; individual parcels may vary in pH and drainage.');
