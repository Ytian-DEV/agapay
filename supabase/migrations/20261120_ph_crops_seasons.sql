-- ============================================================================
-- Agapay Migration: Full Philippine Crop Catalog + Planting Seasons
-- Run this in Supabase SQL Editor (idempotent & safe on existing data!)
-- ============================================================================

-- 1. Expand category check constraint to cover all Philippine agricultural crops
alter table public.crops drop constraint if exists crops_category_check;
alter table public.crops
  add constraint crops_category_check
  check (category in ('rice', 'corn', 'root_crop', 'vegetable', 'legume', 'fruit', 'tree_crop', 'fiber'));

-- 2. Add planting season columns
alter table public.crops
  add column if not exists planting_season text not null default 'wet_and_dry'
    check (planting_season in ('wet', 'dry', 'wet_and_dry', 'year_round')),
  add column if not exists best_planting_months integer[] not null default '{5,6,10,11}',
  add column if not exists season_note text not null default 'Check local rainfall and drainage before planting.';

-- 3. Upsert 20 major Philippine smallholder crops
insert into public.crops (
  slug, name, local_name, category, duration_days, water_need, cost_tier, flood_risk,
  typical_yield_min_sacks, typical_yield_max_sacks, is_pilot_enabled,
  planting_season, best_planting_months, season_note
)
values
  ('rice', 'Rice (Palay)', 'Palay / Humay', 'rice', 115, 'high', 'high', 'medium', 72, 92, true,
   'wet_and_dry', '{5,6,7,11,12,1}', 'Wet season (May–Jul) & irrigated dry season (Nov–Jan).'),
  ('corn', 'Corn', 'Mais', 'corn', 95, 'low', 'medium', 'high', 48, 60, true,
   'wet_and_dry', '{5,6,10,11,12}', 'Plant early wet (May–Jun) or late wet/cool transition (Oct–Dec) on drained soil.'),
  ('sweet-potato', 'Sweet Potato', 'Kamote', 'root_crop', 90, 'medium', 'low', 'low', 110, 145, true,
   'year_round', '{1,2,3,4,5,6,7,8,9,10,11,12}', 'Year-round crop on raised ridges; ideal wet-season alternative to corn.'),
  ('cassava', 'Cassava', 'Balanghoy / Kamoteng Kahoy', 'root_crop', 240, 'low', 'low', 'medium', 140, 185, true,
   'wet_and_dry', '{5,6,7,10,11}', 'Plant when soil has reliable moisture (May–Jul or Oct–Nov) on well-drained slopes.'),
  ('taro', 'Taro', 'Gabi', 'root_crop', 180, 'high', 'low', 'low', 95, 130, true,
   'wet', '{5,6,7,8,9,10,11}', 'Thrives in wet-season lowlands and moist creek banks (May–Nov).'),
  ('purple-yam', 'Purple Yam', 'Ube', 'root_crop', 240, 'medium', 'medium', 'medium', 80, 115, true,
   'wet', '{4,5,6,7}', 'Plant at onset of rainy season (Apr–Jul); avoid dry-season planting.'),
  ('ginger', 'Ginger', 'Luya', 'root_crop', 240, 'medium', 'medium', 'high', 70, 105, true,
   'wet', '{4,5,6}', 'Best planted Apr–Jun before heavy rains on raised mulched beds.'),
  ('squash', 'Squash', 'Kalabasa', 'vegetable', 100, 'medium', 'low', 'medium', 120, 165, true,
   'dry', '{10,11,12,1,2}', 'Best from late wet into dry months (Oct–Feb) to avoid fruit rot.'),
  ('eggplant', 'Eggplant', 'Talong', 'vegetable', 110, 'medium', 'medium', 'medium', 90, 130, true,
   'year_round', '{1,2,3,4,5,6,7,8,9,10,11,12}', 'Grows year-round; yields peak Oct–Mar with good drainage.'),
  ('tomato', 'Tomato', 'Kamatis', 'vegetable', 75, 'medium', 'medium', 'high', 85, 125, true,
   'dry', '{10,11,12,1,2}', 'Cool dry Amihan season (Oct–Feb); avoid peak monsoon blight.'),
  ('ampalaya', 'Bitter Gourd', 'Ampalaya / Paliya', 'vegetable', 70, 'medium', 'medium', 'medium', 80, 115, true,
   'wet_and_dry', '{5,6,7,10,11,12,1}', 'Plant Oct–Jan or May–Jul with sturdy trellises.'),
  ('sitaw', 'String Beans', 'Sitaw / Batong', 'legume', 60, 'medium', 'low', 'low', 60, 85, true,
   'year_round', '{1,2,3,4,5,6,7,8,9,10,11,12}', 'Fast 60-day year-round legume; boosts soil nitrogen.'),
  ('okra', 'Okra', 'Okra', 'vegetable', 55, 'low', 'low', 'low', 65, 95, true,
   'year_round', '{1,2,3,4,5,6,7,8,9,10,11,12}', 'Hardy 55-day crop suited year-round in warm lowlands.'),
  ('red-onion', 'Red Onion', 'Sibuyas', 'vegetable', 100, 'low', 'high', 'high', 90, 130, true,
   'dry', '{10,11,12,1}', 'Strictly dry-season bulb crop (Oct–Jan); avoid rainy season.'),
  ('garlic', 'Garlic', 'Bawang', 'vegetable', 110, 'low', 'high', 'high', 45, 70, true,
   'dry', '{10,11,12}', 'Cool dry Amihan planting only (Oct–Dec).'),
  ('mungbean', 'Mungbean', 'Munggo / Balatong', 'legume', 65, 'low', 'low', 'high', 18, 28, true,
   'dry', '{11,12,1,2}', 'Ideal dry-season rotation right after wet-season rice harvest (Nov–Feb).'),
  ('peanut', 'Peanut', 'Mani', 'legume', 100, 'low', 'medium', 'high', 24, 36, true,
   'dry', '{10,11,12,1,2}', 'Needs loose sandy loam and dry harvest window (Oct–Feb).'),
  ('banana', 'Banana (Saba)', 'Saging / Cardava', 'fruit', 300, 'medium', 'medium', 'medium', 120, 170, true,
   'wet', '{5,6,7,8,9,10,11}', 'Transplant suckers during rainy months (May–Nov) for strong rooting.'),
  ('abaca', 'Abaca', 'Abaka', 'fiber', 540, 'high', 'medium', 'low', 20, 32, true,
   'wet', '{5,6,7,8,9,10,11}', 'Leyte flagship upland fiber crop; plant in rainy foothills (May–Nov).'),
  ('coconut', 'Coconut', 'Niyog / Lubi', 'tree_crop', 365, 'medium', 'low', 'low', 45, 65, true,
   'wet', '{5,6,7,8,9,10,11}', 'Best transplanted during rainy season (May–Nov) in coastal or upland sites.')
on conflict (slug) do update set
  name = excluded.name,
  local_name = excluded.local_name,
  category = excluded.category,
  duration_days = excluded.duration_days,
  water_need = excluded.water_need,
  cost_tier = excluded.cost_tier,
  flood_risk = excluded.flood_risk,
  typical_yield_min_sacks = excluded.typical_yield_min_sacks,
  typical_yield_max_sacks = excluded.typical_yield_max_sacks,
  is_pilot_enabled = excluded.is_pilot_enabled,
  planting_season = excluded.planting_season,
  best_planting_months = excluded.best_planting_months,
  season_note = excluded.season_note;
